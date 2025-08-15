import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, CardBody, Input, Select, Button, Table, FormField, Toast, DeleteConfirmationModal, Textarea, Modal } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon, PauseIcon, PlayIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Licenses() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [typeId, setTypeId] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<'25' | '100' | 'all'>('25');
  const [types, setTypes] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; license: any | null }>({ isOpen: false, license: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ status?: string; licenseTypeId?: string; priceEuro?: string; priceInterval?: string; expiresAt?: string }>({});
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => Promise<void> | void }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const tokenHeader = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, status, typeId, sort, order, page: String(page), pageSize });
      const res = await fetch(`${API}/licenses?${params.toString()}`,[
        { headers: tokenHeader, cache: 'no-store' } as RequestInit
      ].reduce((a,b)=>Object.assign(a,b), {}));
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
      } else if (res.status === 304) {
        // Not modified: keep current items, do nothing
        return;
      } else {
        console.error('Failed to load licenses:', res.status, res.statusText);
        setToast({ message: 'Er ging iets mis bij het laden van de licenties', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading licenses:', error);
      setToast({ message: 'Er ging iets mis bij het laden van de licenties', type: 'error' });
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

  const handleToggleActive = async (license: any) => {
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
    setEdit({});
  };

  // Fallback: als types niet laden, probeer opnieuw
  const retryLoadTypes = () => {
    console.log('Retrying to load license types...');
    loadTypes();
  };

  const pages = pageSize === 'all' ? 1 : Math.ceil(total / Number(pageSize));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Licenties" 
        subtitle="Beheer uw licenties en klantgegevens"
        action={
          <Button 
            variant="primary" 
            icon={PlusIcon} 
            onClick={handleNewLicense}
            disabled={typesLoading || types.length === 0}
          >
            {typesLoading ? 'Laden...' : 'Nieuwe licentie'}
          </Button>
        }
      />
      
      {typesLoading && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            🔄 Licentie types worden geladen...
          </p>
        </div>
      )}
      
      {!typesLoading && types.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              ⚠️ Er zijn nog geen licentie types aangemaakt. Maak eerst een licentie type aan voordat u licenties kunt aanmaken.
            </p>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={retryLoadTypes}
            >
              Opnieuw proberen
            </Button>
          </div>
        </div>
      )}
      
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Zoeken op code, naam, email..." 
              className="max-w-xs" 
            />
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Alle statussen</option>
              <option value="ACTIVE">Actief</option>
              <option value="INACTIVE">Inactief</option>
            </Select>
            <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Alle types</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select value={pageSize} onChange={(e) => setPageSize(e.target.value as any)}>
              <option value="25">25 per pagina</option>
              <option value="100">100 per pagina</option>
              <option value="all">Alles tonen</option>
            </Select>
          </div>
          
          <Table>
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" className="rounded" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                {['code','customerName','customerEmail','customerNumber','domain','status','priceCents','priceInterval','expiresAt','lastApiAccessAt','createdAt'].map((c) => (
                  <Th key={c} col={c} sort={sort} order={order} setSort={setSort} setOrder={setOrder} />
                ))}
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td>
                    <input type="checkbox" className="rounded" checked={selected.includes(l.id)} onChange={() => toggleSelect(l.id)} />
                  </td>
                  <td className="font-mono text-sm">{l.code}</td>
                  <td>{l.customerName}</td>
                  <td>{l.customerEmail}</td>
                  <td>{l.customerNumber || '—'}</td>
                  <td>{l.domain}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      l.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' :
                      'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{(l.priceCents/100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      l.priceInterval === 'MONTHLY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' :
                      l.priceInterval === 'YEARLY' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-300'
                    }`}>
                      {l.priceInterval}
                    </span>
                  </td>
                  <td>{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '—'}</td>
                  <td className="text-zinc-500 dark:text-zinc-400">{l.lastApiAccessAt ? new Date(l.lastApiAccessAt).toLocaleString() : '—'}</td>
                  <td className="text-zinc-500 dark:text-zinc-400">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        aria-label="Bewerken"
                        title="Bewerken"
                        onClick={() => setEdit(l)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        aria-label="Licentie e-mail opnieuw sturen"
                        title="Licentie e-mail opnieuw sturen"
                        onClick={() => setConfirm({
                          open: true,
                          title: 'E-mail opnieuw sturen',
                          message: `Weet u zeker dat u de licentiemail opnieuw wilt versturen naar ${l.customerEmail}?`,
                          onConfirm: async () => {
                            try { await resendEmail(l.id); setToast({ message: 'E-mail opnieuw verstuurd', type: 'success' }); }
                            catch { setToast({ message: 'Versturen mislukt', type: 'error' }); }
                          }
                        })}
                      >
                        <EnvelopeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        aria-label={l.status === 'ACTIVE' ? 'Deactiveren' : 'Activeren'}
                        title={l.status === 'ACTIVE' ? 'Deactiveren' : 'Activeren'}
                        disabled={rowSavingId === l.id}
                        onClick={() => handleToggleActive(l)}
                      >
                        {l.status === 'ACTIVE' ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      {l.status === 'INACTIVE' && (
                        <button
                          className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          aria-label="Verwijderen"
                          title="Verwijderen"
                          onClick={() => setDeleteModal({ isOpen: true, license: l })}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {selected.length > 0 && (
            <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 glass-card border px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-end gap-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-300 mr-2">{selected.length} geselecteerd</span>
                <Select value={bulk.status || ''} onChange={(e) => setBulk({ ...bulk, status: e.target.value || undefined })} className="w-40">
                  <option value="">Status…</option>
                  <option value="ACTIVE">Actief</option>
                  <option value="INACTIVE">Inactief</option>
                </Select>
                <Select value={bulk.licenseTypeId || ''} onChange={(e) => setBulk({ ...bulk, licenseTypeId: e.target.value || undefined })} className="w-48">
                  <option value="">Type…</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                <Input type="number" step="0.01" placeholder="Prijs (€)" value={bulk.priceEuro ?? ''} onChange={(e) => setBulk({ ...bulk, priceEuro: e.target.value })} className="w-36" />
                <Select value={bulk.priceInterval || ''} onChange={(e) => setBulk({ ...bulk, priceInterval: e.target.value || undefined })} className="w-40">
                  <option value="">Interval…</option>
                  <option value="ONE_TIME">Eenmalig</option>
                  <option value="MONTHLY">Maandelijks</option>
                  <option value="YEARLY">Jaarlijks</option>
                </Select>
                <Input type="date" value={bulk.expiresAt ?? ''} onChange={(e) => setBulk({ ...bulk, expiresAt: e.target.value })} />
                <Button variant="primary" onClick={applyBulk}>Toepassen</Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setConfirm({ 
                    open: true, 
                    title: 'E-mail opnieuw versturen', 
                    message: `Weet u zeker dat u de licentiemail opnieuw wilt versturen naar ${selected.length} licenties?`, 
                    onConfirm: async () => { 
                      try { await Promise.all(selected.map(id => resendEmail(id))); setToast({ message: 'E-mails verstuurd', type: 'success' }); } 
                      catch { setToast({ message: 'Versturen mislukt', type: 'error' }); } 
                    } 
                  })}
                >E-mail opnieuw</Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setConfirm({ 
                    open: true, 
                    title: 'Licenties verwijderen', 
                    message: `Weet u zeker dat u ${selected.length} licenties wilt verwijderen?`, 
                    onConfirm: async () => { 
                      try { await Promise.all(selected.map(id => fetch(`${API}/licenses/${id}`, { method: 'DELETE', headers: tokenHeader }))); setToast({ message: 'Licenties verwijderd', type: 'success' }); setSelected([]); await load(); } 
                      catch { setToast({ message: 'Verwijderen mislukt', type: 'error' }); } 
                    } 
                  })}
                >Verwijderen</Button>
                <Button variant="secondary" onClick={() => setSelected([])}>Leegmaken</Button>
              </div>
            </div>
          )}

          <Modal isOpen={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })} title={confirm.title}>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">{confirm.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirm({ ...confirm, open: false })}>Annuleren</Button>
              <Button variant="primary" onClick={async () => { const fn = confirm.onConfirm; setConfirm({ ...confirm, open: false }); await fn(); await load(); }}>Bevestigen</Button>
            </div>
          </Modal>
          
          {pageSize !== 'all' && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Pagina {page} van {pages || 1} ({total} totaal)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={page<=1} onClick={() => setPage((p)=>p-1)}>
                  Vorige
                </Button>
                <Button variant="secondary" size="sm" disabled={page>=pages} onClick={() => setPage((p)=>p+1)}>
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {edit && (
        <EditModal 
          value={edit} 
          onClose={() => setEdit(null)} 
          onSaved={(message) => { 
            setEdit(null); 
            load(); 
            setToast({ message, type: 'success' }); 
          }} 
          types={types} 
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, license: null })}
        onConfirm={handleDelete}
        title="Licentie verwijderen"
        message={`Weet u zeker dat u de licentie "${deleteModal.license?.code}" voor ${deleteModal.license?.customerName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        confirmText="Verwijderen"
        cancelText="Annuleren"
      />

      {/* Toast notifications */}
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

function Th({ col, sort, order, setSort, setOrder }: any) {
  const labelMap: any = {
    code: 'Code', customerName:'Klantnaam', customerEmail:'E-mail', customerNumber:'Klantnr', domain:'Domein', status:'Status', priceCents:'Prijs', priceInterval:'Interval', expiresAt:'Vervaldatum', lastApiAccessAt:'Laatste API', createdAt:'Aangemaakt'
  };
  const active = sort === col;
  return (
    <th className={`th cursor-pointer select-none ${active ? 'text-zinc-900 dark:text-zinc-50' : ''}`} onClick={() => { setSort(col); setOrder(active && order==='asc' ? 'desc' : 'asc'); }}>
      {labelMap[col] || col} {active ? (order==='asc' ? '▲' : '▼') : ''}
    </th>
  );
}

function EditModal({ value, onClose, onSaved, types }: any) {
  const [form, setForm] = useState<any>({
    code: '', customerName:'', customerEmail:'', customerNumber:'', domain:'', licenseTypeId: '', status:'ACTIVE', notes:'', priceCents:0, priceInterval:'ONE_TIME', sendEmail:false,
    ...value,
    // Map bestaande licenties (edit) zodat licenseTypeId correct gevuld is
    licenseTypeId: (value as any)?.licenseTypeId || (value as any)?.typeId || '',
    expiresAt: value?.expiresAt ? new Date(value.expiresAt).toISOString().slice(0,10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = !value.id;
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const validateForm = () => {
    if (!form.customerName?.trim()) {
      setError('Klantnaam is verplicht');
      return false;
    }
    if (!form.customerEmail?.trim()) {
      setError('Klant e-mail is verplicht');
      return false;
    }
    if (!form.licenseTypeId) {
      setError('Licentie type is verplicht');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API}/licenses` : `${API}/licenses/${value.id}`;

      // Automatisch wildcard maken als domein leeg is
      const domain = form.domain?.trim() || '*';

      // Alleen toegestane velden meesturen; verwijder read-only en relationele objecten zoals `type`
      const payload: any = {
        code: form.code?.trim() || undefined,
        customerName: form.customerName?.trim(),
        customerEmail: form.customerEmail?.trim(),
        customerNumber: form.customerNumber?.trim() || undefined,
        domain,
        licenseTypeId: form.licenseTypeId || undefined,
        status: form.status,
        notes: form.notes || undefined,
        priceCents: typeof form.priceCents === 'number' ? form.priceCents : undefined,
        priceInterval: form.priceInterval,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        sendEmail: Boolean(form.sendEmail) && isNew ? true : undefined,
      };
      // Verwijder undefined keys
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const response = await fetch(url, { method, headers: tokenHeader, body: JSON.stringify(payload) });
      
      if (response.ok) {
        onSaved(isNew ? 'Licentie succesvol aangemaakt!' : 'Licentie succesvol bijgewerkt!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Er ging iets mis');
      }
    } catch (error: any) {
      console.error('License save error:', error);
      setError(error.message || 'Er ging iets mis bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  // Als er geen types zijn, toon een foutmelding
  if (types.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardBody>
            <div className="text-center space-y-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-lg">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Geen licentie types beschikbaar
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Er zijn geen licentie types beschikbaar. Maak eerst een licentie type aan voordat u licenties kunt aanmaken.
              </p>
              <Button variant="secondary" onClick={onClose}>
                Sluiten
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="h-full">
          <CardBody className="overflow-y-auto max-h-[calc(90vh-2rem)]">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isNew ? 'Nieuwe licentie aanmaken' : 'Licentie bewerken'}
              </h2>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Licentiecode">
                  <Input 
                    placeholder="Automatisch gegenereerd indien leeg" 
                    value={form.code || ''} 
                    onChange={(e) => setForm({...form, code: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Status">
                  <Select value={form.status || 'ACTIVE'} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option value="ACTIVE">Actief</option>
                    <option value="INACTIVE">Inactief</option>
                  </Select>
                </FormField>
                
                <FormField label="Klantnaam *">
                  <Input 
                    placeholder="Bedrijfsnaam of persoon" 
                    value={form.customerName || ''} 
                    onChange={(e) => setForm({...form, customerName: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Klant e-mail *">
                  <Input 
                    type="email"
                    placeholder="klant@bedrijf.nl" 
                    value={form.customerEmail || ''} 
                    onChange={(e) => setForm({...form, customerEmail: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Klantnummer (optioneel)">
                  <Input 
                    placeholder="12345" 
                    value={form.customerNumber || ''} 
                    onChange={(e) => setForm({...form, customerNumber: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Domein (leeg = wildcard *)">
                  <Input 
                    placeholder="example.com of leeg voor wildcard" 
                    value={form.domain || ''} 
                    onChange={(e) => setForm({...form, domain: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Licentie type *">
                  <Select value={form.licenseTypeId || ''} onChange={(e) => setForm({...form, licenseTypeId: e.target.value})}>
                    <option value="">Selecteer type</option>
                    {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </FormField>
                
                <FormField label="Vervaldatum (optioneel)">
                  <Input 
                    type="date" 
                    value={form.expiresAt || ''} 
                    onChange={(e) => setForm({...form, expiresAt: e.target.value})} 
                  />
                </FormField>
                
                <FormField label="Prijs (in euro)">
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={String((form.priceCents || 0) / 100)} 
                    onChange={(e) => setForm({...form, priceCents: Math.round(Number(e.target.value || 0) * 100)})} 
                  />
                </FormField>
                
                <FormField label="Prijs interval">
                  <Select value={form.priceInterval || 'ONE_TIME'} onChange={(e) => setForm({...form, priceInterval: e.target.value})}>
                    <option value="ONE_TIME">Eenmalig</option>
                    <option value="MONTHLY">Maandelijks</option>
                    <option value="YEARLY">Jaarlijks</option>
                  </Select>
                </FormField>
              </div>
              
              <FormField label="Notities (optioneel)">
                <Textarea 
                  placeholder="Interne notities over deze licentie..." 
                  value={form.notes || ''} 
                  onChange={(e) => setForm({...form, notes: e.target.value})} 
                  rows={3}
                />
              </FormField>
              
              {isNew && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="sendEmail"
                    checked={form.sendEmail || false} 
                    onChange={(e) => setForm({...form, sendEmail: e.target.checked})} 
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-blue-700 dark:text-blue-300">
                    Verstuur licentie direct naar klant via e-mail
                  </label>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? 'Opslaan...' : (isNew ? 'Aanmaken' : 'Opslaan')}
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Annuleren
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


