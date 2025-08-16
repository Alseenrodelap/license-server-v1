import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, CardBody, Input, Select, Button, Table, FormField, Toast, DeleteConfirmationModal, Textarea, Modal } from '../components/ui';
import { 
	PlusIcon, 
	PencilIcon, 
	TrashIcon, 
	PauseIcon, 
	PlayIcon, 
	EnvelopeIcon,
	ShieldCheckIcon,
	KeyIcon,
	EyeIcon,
	EyeSlashIcon
} from '@heroicons/react/24/outline';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

interface License {
	id: string;
	code: string;
	customerName: string;
	customerEmail: string;
	customerNumber?: string;
	domain: string;
	type: { id: string; name: string };
	status: string;
	notes?: string;
	priceCents: number;
	priceInterval: string;
	expiresAt?: string;
	isCryptographic: boolean;
	requiresEmailVerification: boolean;
	emailVerifiedAt?: string;
	createdAt: string;
	updatedAt: string;
}

interface LicenseType {
	id: string;
	name: string;
}

export default function Licenses() {
	const [items, setItems] = useState<License[]>([]);
	const [total, setTotal] = useState(0);
	const [q, setQ] = useState('');
	const [status, setStatus] = useState('');
	const [typeId, setTypeId] = useState('');
	const [sort, setSort] = useState('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<'25' | '100' | 'all'>('25');
	const [types, setTypes] = useState<LicenseType[]>([]);
	const [edit, setEdit] = useState<License | null>(null);
	const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; license: License | null }>({ isOpen: false, license: null });
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [loading, setLoading] = useState(false);
	const [typesLoading, setTypesLoading] = useState(true);
	const [selected, setSelected] = useState<string[]>([]);
	const [rowSavingId, setRowSavingId] = useState<string | null>(null);
	const [bulk, setBulk] = useState<{ status?: string; licenseTypeId?: string; priceEuro?: string; priceInterval?: string; expiresAt?: string }>({});
	const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => Promise<void> | void }>({ open: false, title: '', message: '', onConfirm: () => {} });

	// Nieuwe state voor form
	const [formData, setFormData] = useState({
		customerName: '',
		customerEmail: '',
		customerNumber: '',
		domain: '',
		typeId: '',
		status: 'ACTIVE',
		notes: '',
		priceCents: 0,
		priceInterval: 'ONE_TIME',
		expiresAt: '',
		sendEmail: false,
		isCryptographic: false,
		requiresEmailVerification: false,
	});

	const tokenHeader = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

	const load = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ q, status, typeId, sort, order, page: String(page), pageSize });
			const res = await fetch(`${API}/licenses?${params.toString()}`, [
				{ headers: tokenHeader, cache: 'no-store' } as RequestInit
			].reduce((a, b) => Object.assign(a, b), {}));
			if (res.ok) {
				const data = await res.json();
				setItems(data.items || []);
				setTotal(data.total || 0);
			} else if (res.status === 304) {
				// Not modified: keep current items, do nothing
				return;
			} else if (res.status === 404) {
				// No licenses found - this is normal for a new system
				setItems([]);
				setTotal(0);
			} else {
				console.error('Failed to load licenses:', res.status, res.statusText);
				setToast({ message: 'Er ging iets mis bij het laden van de licenties', type: 'error' });
			}
		} catch (error) {
			console.error('Error loading licenses:', error);
			// Don't show error toast for network errors when there might just be no licenses
			if (items.length === 0) {
				setItems([]);
				setTotal(0);
			} else {
				setToast({ message: 'Er ging iets mis bij het laden van de licenties', type: 'error' });
			}
		} finally {
			setLoading(false);
		}
	};

	const isAllSelected = items.length > 0 && selected.length === items.map(i => i.id).filter(Boolean).length;
	const toggleSelectAll = () => {
		if (isAllSelected) setSelected([]);
		else setSelected(items.map(i => i.id));
	};
	const toggleSelect = (id: string) => {
		setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
	};

	const updateLicense = async (id: string, data: any) => {
		const res = await fetch(`${API}/licenses/${id}`, { method: 'PUT', headers: { ...tokenHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
		if (!res.ok) throw new Error(`Update failed (${res.status})`);
	};

	const handleToggleActive = async (license: License) => {
		try {
			setRowSavingId(license.id);
			const newStatus = license.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
			await updateLicense(license.id, { status: newStatus });
			await load();
			setToast({ message: newStatus === 'ACTIVE' ? 'Licentie geactiveerd' : 'Licentie gedeactiveerd', type: 'success' });
		} catch (e) {
			setToast({ message: 'Wijzigen status mislukt', type: 'error' });
		} finally {
			setRowSavingId(null);
		}
	};

	const resendEmail = async (id: string) => {
		const res = await fetch(`${API}/licenses/${id}/resend-email`, { method: 'POST', headers: tokenHeader });
		if (!res.ok) throw new Error('E-mail verzenden mislukt');
	};

	const resendVerification = async (id: string) => {
		try {
			const res = await fetch(`${API}/licenses/resend-verification/${id}`, { method: 'POST', headers: tokenHeader });
			if (res.ok) {
				setToast({ message: 'Verificatie e-mail opnieuw verzonden', type: 'success' });
			} else if (res.status === 429) {
				const error = await res.json();
				setToast({ message: error.error || 'Wacht 5 minuten voordat u een nieuwe verificatie e-mail aanvraagt', type: 'error' });
			} else {
				const error = await res.json();
				setToast({ message: error.error || 'Verificatie e-mail verzenden mislukt', type: 'error' });
			}
		} catch (error) {
			setToast({ message: 'Verificatie e-mail verzenden mislukt', type: 'error' });
		}
	};

	const applyBulk = async () => {
		const payload: any = {};
		if (bulk.status) payload.status = bulk.status;
		if (bulk.licenseTypeId) payload.typeId = bulk.licenseTypeId;
		if (bulk.priceEuro !== undefined && bulk.priceEuro !== '') payload.priceCents = Math.round(Number(bulk.priceEuro) * 100);
		if (bulk.priceInterval) payload.priceInterval = bulk.priceInterval;
		if (bulk.expiresAt !== undefined && bulk.expiresAt !== '') payload.expiresAt = new Date(bulk.expiresAt).toISOString();
		if (Object.keys(payload).length === 0) { setToast({ message: 'Kies eerst een wijziging', type: 'error' }); return; }

		try {
			await Promise.all(selected.map(id => updateLicense(id, payload)));
			setToast({ message: 'Bulk wijzigingen toegepast', type: 'success' });
			setSelected([]);
			setBulk({});
			await load();
		} catch (e) {
			setToast({ message: 'Bulk wijzigingen mislukt', type: 'error' });
		}
	};

	const loadTypes = async () => {
		setTypesLoading(true);
		try {
			console.log('Loading license types...');
			const res = await fetch(`${API}/license-types`, { headers: tokenHeader, cache: 'no-store' });
			console.log('License types response:', res.status, res.statusText);

			if (res.ok) {
				const data = await res.json();
				console.log('License types data:', data);
				setTypes(data.items || []);
			} else {
				console.error('Failed to load license types:', res.status, res.statusText);
				const errorText = await res.text();
				console.error('Error response:', errorText);
				setToast({ message: 'Er ging iets mis bij het laden van licentie types', type: 'error' });
			}
		} catch (error) {
			console.error('Error loading license types:', error);
			setToast({ message: 'Er ging iets mis bij het laden van licentie types', type: 'error' });
		} finally {
			setTypesLoading(false);
		}
	};

	useEffect(() => {
		loadTypes();
	}, []);

	useEffect(() => {
		load();
	}, [q, status, typeId, sort, order, page, pageSize]);

	// Reset naar eerste pagina bij filter- of zoekwijziging
	useEffect(() => {
		setPage(1);
	}, [q, status, typeId]);

	const handleDelete = async () => {
		if (!deleteModal.license) return;

		try {
			const response = await fetch(`${API}/licenses/${deleteModal.license.id}`, { method: 'DELETE', headers: tokenHeader });
			if (response.ok) {
				load();
				setToast({ message: 'Licentie succesvol verwijderd!', type: 'success' });
			} else {
				setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
			}
		} catch (error) {
			setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
		}
	};

	const handleNewLicense = () => {
		console.log('Opening new license modal, types:', types);
		if (types.length === 0) {
			setToast({ message: 'Er zijn geen licentie types beschikbaar. Maak eerst een type aan.', type: 'error' });
			return;
		}
		setFormData({
			customerName: '',
			customerEmail: '',
			customerNumber: '',
			domain: '',
			typeId: '',
			status: 'ACTIVE',
			notes: '',
			priceCents: 0,
			priceInterval: 'ONE_TIME',
			expiresAt: '',
			sendEmail: false,
			isCryptographic: false,
			requiresEmailVerification: false,
		});
		setEdit({} as License);
	};

	const handleEditLicense = (license: License) => {
		setFormData({
			customerName: license.customerName,
			customerEmail: license.customerEmail,
			customerNumber: license.customerNumber || '',
			domain: license.domain,
			typeId: license.type.id,
			status: license.status,
			notes: license.notes || '',
			priceCents: license.priceCents,
			priceInterval: license.priceInterval,
			expiresAt: license.expiresAt ? license.expiresAt.split('T')[0] : '',
			sendEmail: false,
			isCryptographic: license.isCryptographic,
			requiresEmailVerification: license.requiresEmailVerification,
		});
		setEdit(license);
	};

	const handleSaveLicense = async () => {
		try {
			setLoading(true);
			const url = edit ? `${API}/licenses/${edit.id}` : `${API}/licenses`;
			const method = edit ? 'PUT' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { ...tokenHeader, 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			if (res.ok) {
				setToast({ message: edit ? 'Licentie bijgewerkt!' : 'Licentie aangemaakt!', type: 'success' });
				setEdit(null);
				await load();
			} else {
				const error = await res.json();
				setToast({ message: error.error || 'Er ging iets mis', type: 'error' });
			}
		} catch (error) {
			setToast({ message: 'Er ging iets mis', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	// Fallback: als types niet laden, probeer opnieuw
	const retryLoadTypes = () => {
		console.log('Retrying to load license types...');
		loadTypes();
	};

	const pages = pageSize === 'all' ? 1 : Math.ceil(total / Number(pageSize));

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
			case 'INACTIVE': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
			case 'EXPIRED': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
			default: return 'text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-900/20';
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Licenties"
				subtitle="Beheer uw licenties en klantgegevens"
				action={
					<div className="flex flex-col items-end sm:items-start sm:flex-row sm:gap-3">
					<Button
						variant="primary"
						icon={PlusIcon}
						onClick={handleNewLicense}
						disabled={typesLoading || types.length === 0}
					>
						Licentie aanmaken
					</Button>
					{!typesLoading && types.length === 0 && (
						<span className="mt-1 text-xs text-zinc-500">Maak eerst licentietypes aan</span>
					)}
					</div>
				}
			/>

			{/* Filters */}
			<Card>
				<CardBody>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="relative">
							<input
								type="text"
								placeholder="Zoeken..."
								value={q}
								onChange={(e) => setQ(e.target.value)}
								className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
							/>
						</div>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
						>
							<option value="">Alle statussen</option>
							<option value="ACTIVE">Actief</option>
							<option value="INACTIVE">Inactief</option>
							<option value="EXPIRED">Verlopen</option>
						</select>
						<select
							value={typeId}
							onChange={(e) => setTypeId(e.target.value)}
							className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
						>
							<option value="">Alle types</option>
							{types.map(type => (
								<option key={type.id} value={type.id}>{type.name}</option>
							))}
						</select>
						<select
							value={`${sort}-${order}`}
							onChange={(e) => {
								const [field, order] = e.target.value.split('-');
								setSort(field);
								setOrder(order as 'asc' | 'desc');
							}}
							className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
						>
							<option value="createdAt-desc">Nieuwste eerst</option>
							<option value="createdAt-asc">Oudste eerst</option>
							<option value="customerName-asc">Naam A-Z</option>
							<option value="customerName-desc">Naam Z-A</option>
							<option value="expiresAt-asc">Vervaldatum</option>
						</select>
					</div>
				</CardBody>
			</Card>

			{/* Licenses Table */}
			<Card>
				<CardBody>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-zinc-200 dark:border-zinc-700">
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Code</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Klant</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Type</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Status</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Domein</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Vervaldatum</th>
									<th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Opties</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item) => (
									<tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
										<td className="py-3 px-4">
											<div className="flex items-center gap-2">
												<span className="font-mono text-sm">{item.code}</span>
												{item.isCryptographic && (
													<ShieldCheckIcon className="h-4 w-4 text-blue-500" title="Cryptografische sleutel" />
												)}
												{item.requiresEmailVerification && (
													<EnvelopeIcon className="h-4 w-4 text-orange-500" title="E-mail verificatie vereist" />
												)}
											</div>
										</td>
										<td className="py-3 px-4">
											<div>
												<div className="font-medium text-zinc-900 dark:text-zinc-100">{item.customerName}</div>
												<div className="text-sm text-zinc-500 dark:text-zinc-400">{item.customerEmail}</div>
											</div>
										</td>
										<td className="py-3 px-4">{item.type.name}</td>
										<td className="py-3 px-4">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
												{item.status}
											</span>
											{item.requiresEmailVerification && !item.emailVerifiedAt && (
												<div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
													Wacht op verificatie
												</div>
											)}
										</td>
										<td className="py-3 px-4">{item.domain}</td>
										<td className="py-3 px-4">
											{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '-'}
										</td>
										<td className="py-3 px-4">
											<div className="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleEditLicense(item)}
													title="Bewerken"
												>
													<PencilIcon className="h-4 w-4" />
												</Button>
												{item.requiresEmailVerification && !item.emailVerifiedAt && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => resendVerification(item.id)}
														title="Verificatie e-mail opnieuw verzenden"
													>
														<EnvelopeIcon className="h-4 w-4" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setDeleteModal({ isOpen: true, license: item })}
													title="Verwijderen"
												>
													<TrashIcon className="h-4 w-4" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{total > Number(pageSize) && (
						<div className="flex justify-between items-center mt-6">
							<div className="text-sm text-zinc-500">
								{((page - 1) * Number(pageSize)) + 1} - {Math.min(page * Number(pageSize), total)} van {total}
							</div>
							<div className="flex gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setPage(page - 1)}
									disabled={page === 1}
								>
									Vorige
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setPage(page + 1)}
									disabled={page * Number(pageSize) >= total}
								>
									Volgende
								</Button>
							</div>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Create/Edit Modal */}
			{edit !== null && (
				<Modal
					isOpen={true}
					onClose={() => setEdit(null)}
					title={edit.id ? 'Licentie bewerken' : 'Nieuwe licentie'}
				>
					<div className="space-y-4">
						<FormField label="Klantnaam">
							<Input
								value={formData.customerName}
								onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
								placeholder="Naam van de klant"
								required
							/>
						</FormField>

						<FormField label="E-mailadres">
							<Input
								type="email"
								value={formData.customerEmail}
								onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
								placeholder="klant@example.com"
								required
							/>
						</FormField>

						<FormField label="Klantnummer (optioneel)">
							<Input
								value={formData.customerNumber}
								onChange={(e) => setFormData({ ...formData, customerNumber: e.target.value })}
								placeholder="Klantnummer"
							/>
						</FormField>

						<FormField label="Domein">
							<Input
								value={formData.domain}
								onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
								placeholder="example.com of * voor wildcard"
								required
							/>
						</FormField>

						<FormField label="Licentie type">
							<Select
								value={formData.typeId}
								onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
								required
							>
								<option value="">Selecteer type</option>
								{types.map(type => (
									<option key={type.id} value={type.id}>{type.name}</option>
								))}
							</Select>
						</FormField>

						<FormField label="Status">
							<Select
								value={formData.status}
								onChange={(e) => setFormData({ ...formData, status: e.target.value })}
							>
								<option value="ACTIVE">Actief</option>
								<option value="INACTIVE">Inactief</option>
							</Select>
						</FormField>

						<FormField label="Vervaldatum (optioneel)">
							<Input
								type="date"
								value={formData.expiresAt}
								onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
							/>
						</FormField>

						<FormField label="Notities (optioneel)">
							<Textarea
								value={formData.notes}
								onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
								placeholder="Extra notities over deze licentie"
							/>
						</FormField>

						{/* Nieuwe opties */}
						<div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
							<h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Geavanceerde opties</h3>
							
							<FormField label="Sleutel type">
								<div className="space-y-2">
									<label className="flex items-center gap-2">
										<input
											type="radio"
											name="keyType"
											checked={!formData.isCryptographic}
											onChange={() => setFormData({ ...formData, isCryptographic: false })}
											className="rounded border-zinc-300 dark:border-zinc-600"
										/>
										<span className="text-sm">Random gegenereerde sleutel</span>
									</label>
									<label className="flex items-center gap-2">
										<input
											type="radio"
											name="keyType"
											checked={formData.isCryptographic}
											onChange={() => setFormData({ ...formData, isCryptographic: true })}
											className="rounded border-zinc-300 dark:border-zinc-600"
										/>
										<span className="text-sm">Cryptografisch gekoppeld aan e-mail</span>
									</label>
								</div>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Cryptografische sleutels zijn deterministisch gegenereerd op basis van het e-mailadres en vereisen e-mail verificatie bij gebruik.
								</p>
							</FormField>

							<FormField label="E-mail verificatie">
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={formData.requiresEmailVerification}
										onChange={(e) => setFormData({ ...formData, requiresEmailVerification: e.target.checked })}
										className="rounded border-zinc-300 dark:border-zinc-600"
									/>
									<span className="text-sm">E-mail verificatie vereisen bij licentie verificatie</span>
								</label>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Als ingeschakeld, wordt er een verificatie e-mail verzonden wanneer de licentie wordt opgevraagd. De licentie is alleen geldig na e-mail verificatie.
								</p>
							</FormField>

							<FormField label="E-mail verzenden">
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={formData.sendEmail}
										onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
										className="rounded border-zinc-300 dark:border-zinc-600"
									/>
									<span className="text-sm">Licentie per e-mail verzenden naar klant</span>
								</label>
							</FormField>
						</div>
					</div>

					<div className="flex gap-3 mt-6">
						<Button variant="secondary" onClick={() => setEdit(null)} className="flex-1">
							Annuleren
						</Button>
						<Button variant="primary" onClick={handleSaveLicense} disabled={loading} className="flex-1">
							{loading ? 'Opslaan...' : (edit.id ? 'Bijwerken' : 'Aanmaken')}
						</Button>
					</div>
				</Modal>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteModal.isOpen}
				onClose={() => setDeleteModal({ isOpen: false, license: null })}
				onConfirm={handleDelete}
				title="Licentie verwijderen"
				message={`Weet u zeker dat u de licentie "${deleteModal.license?.code}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
			/>

			{/* Toast */}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
		</div>
	);
}


