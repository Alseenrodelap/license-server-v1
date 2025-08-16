import React, { useState, useEffect } from 'react';
import { Card, CardBody, Input, Button, FormField } from '../components/ui';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

interface VerificationResult {
	valid: boolean;
	reason?: string;
	requiresVerification?: boolean;
	licenseId?: string;
	message?: string;
	license?: {
		id: string;
		code: string;
		customerName: string;
		customerEmail: string;
		domain: string;
		type: string;
		status: string;
		expiresAt?: string;
		isCryptographic: boolean;
		requiresEmailVerification: boolean;
		emailVerifiedAt?: string;
	};
}

export default function VerifyLicense() {
	const [licenseCode, setLicenseCode] = useState('');
	const [customerEmail, setCustomerEmail] = useState('');
	const [result, setResult] = useState<VerificationResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

	const handleVerify = async () => {
		if (!licenseCode.trim()) {
			setMessage({ text: 'Voer een licentiecode in', type: 'error' });
			return;
		}

		setLoading(true);
		setResult(null);
		setMessage(null);

		try {
			const response = await fetch(`${API}/licenses/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					licenseCode: licenseCode.trim(),
					customerEmail: customerEmail.trim() || undefined
				})
			});

			const data = await response.json();
			setResult(data);

			if (data.valid) {
				setMessage({ text: 'Licentie is geldig!', type: 'success' });
			} else if (data.requiresVerification) {
				setMessage({ 
					text: data.message || 'Verificatie e-mail verzonden. Controleer uw inbox.', 
					type: 'info' 
				});
			} else {
				setMessage({ text: data.reason || 'Licentie is ongeldig', type: 'error' });
			}
		} catch (error) {
			setMessage({ text: 'Er ging iets mis bij het verifiëren van de licentie', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleEmailVerification = async (token: string) => {
		setLoading(true);
		setMessage(null);

		try {
			const response = await fetch(`${API}/licenses/verify-email/${token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();

			if (response.ok) {
				setMessage({ text: 'E-mail succesvol geverifieerd! U kunt nu uw licentie verifiëren.', type: 'success' });
				// Toon licentie details na verificatie
				if (data.license) {
					setResult({
						valid: true,
						license: {
							...data.license,
							isCryptographic: false,
							requiresEmailVerification: false,
							emailVerifiedAt: new Date().toISOString()
						}
					});
				}
			} else {
				setMessage({ text: data.error || 'E-mail verificatie mislukt', type: 'error' });
			}
		} catch (error) {
			setMessage({ text: 'Er ging iets mis bij de e-mail verificatie', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	// Check voor verificatie token in URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		
		if (token) {
			handleEmailVerification(token);
		}
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<Card>
					<CardBody>
						<div className="text-center mb-6">
							<div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
								<ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
							</div>
							<h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
								Licentie Verificatie
							</h1>
							<p className="text-zinc-600 dark:text-zinc-400 mt-2">
								Verificeer uw licentie om toegang te krijgen
							</p>
						</div>

						<form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
							<FormField label="Licentiecode">
								<Input
									value={licenseCode}
									onChange={(e) => setLicenseCode(e.target.value)}
									placeholder="Voer uw licentiecode in"
									required
									className="font-mono"
								/>
							</FormField>

							<FormField label="E-mailadres (optioneel)">
								<Input
									type="email"
									value={customerEmail}
									onChange={(e) => setCustomerEmail(e.target.value)}
									placeholder="klant@example.com"
								/>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Alleen nodig voor cryptografische licenties
								</p>
							</FormField>

							<Button
								type="submit"
								variant="primary"
								disabled={loading}
								className="w-full"
							>
								{loading ? 'Verifiëren...' : 'Verificeer Licentie'}
							</Button>
						</form>

						{/* Resultaat */}
						{result && (
							<div className="mt-6 p-4 rounded-lg border">
								{result.valid ? (
									<div className="flex items-start gap-3">
										<CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5" />
										<div className="flex-1">
											<h3 className="font-semibold text-green-700 dark:text-green-300">
												Licentie Geldig
											</h3>
											{result.license && (
												<div className="mt-2 space-y-1 text-sm">
													<div><strong>Klant:</strong> {result.license.customerName}</div>
													<div><strong>E-mail:</strong> {result.license.customerEmail}</div>
													<div><strong>Type:</strong> {result.license.type}</div>
													<div><strong>Domein:</strong> {result.license.domain}</div>
													<div><strong>Status:</strong> {result.license.status}</div>
													{result.license.expiresAt && (
														<div><strong>Vervaldatum:</strong> {new Date(result.license.expiresAt).toLocaleDateString()}</div>
													)}
													{result.license.isCryptographic && (
														<div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
															<ShieldCheckIcon className="w-4 h-4" />
															<span>Cryptografische sleutel</span>
														</div>
													)}
													{result.license.requiresEmailVerification && (
														<div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
															<EnvelopeIcon className="w-4 h-4" />
															<span>E-mail verificatie vereist</span>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								) : result.requiresVerification ? (
									<div className="flex items-start gap-3">
										<EnvelopeIcon className="w-6 h-6 text-orange-500 mt-0.5" />
										<div className="flex-1">
											<h3 className="font-semibold text-orange-700 dark:text-orange-300">
												E-mail Verificatie Vereist
											</h3>
											<p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
												Er is een verificatie e-mail verzonden naar uw e-mailadres. 
												Klik op de link in de e-mail om uw licentie te activeren.
											</p>
											<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
												De verificatie link is 5 minuten geldig.
											</p>
										</div>
									</div>
								) : (
									<div className="flex items-start gap-3">
										<XCircleIcon className="w-6 h-6 text-red-500 mt-0.5" />
										<div className="flex-1">
											<h3 className="font-semibold text-red-700 dark:text-red-300">
												Licentie Ongeldig
											</h3>
											<p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
												{result.reason || 'De opgegeven licentie is niet geldig.'}
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Message */}
						{message && (
							<div className={`mt-4 p-3 rounded-lg text-sm ${
								message.type === 'success' 
									? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
									: message.type === 'error'
									? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
									: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
							}`}>
								{message.text}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
