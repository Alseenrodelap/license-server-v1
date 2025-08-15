import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, CardBody, Input, Select, Button, Table, FormField, Toast } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const tokenHeader = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const load = async () => {
    const params = new URLSearchParams({ q, status, typeId, sort, order, page: String(page), pageSize });
    const res = await fetch(`${API}/licenses?${params.toString()}`, { headers: tokenHeader });
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/license-types`, { headers: tokenHeader });
      setTypes((await res.json()).items);
    })();
  }, []);

  useEffect(() => { load(); }, [q, status, typeId, sort, order, page, pageSize]);

  const pages = pageSize === 'all' ? 1 : Math.ceil(total / Number(pageSize));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Licenties" 
        subtitle="Beheer uw licenties en klantgegevens"
        action={
          <Button variant="primary" icon={PlusIcon} onClick={() => setEdit({})}>
            Nieuwe licentie
          </Button>
        }
      />
      
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
                {['code','customerName','customerEmail','customerNumber','domain','status','priceCents','priceInterval','expiresAt','lastApiAccessAt','createdAt'].map((c) => (
                  <Th key={c} col={c} sort={sort} order={order} setSort={setSort} setOrder={setOrder} />
                ))}
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
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
                      <Button variant="ghost" size="sm" icon={PencilIcon} onClick={() => setEdit(l)}>
                        Bewerken
                      </Button>
                      <Button variant="ghost" size="sm" icon={TrashIcon} onClick={async () => {
                        if (!confirm('Weet u zeker dat u deze licentie wilt verwijderen?')) return;
                        try {
                          const response = await fetch(`${API}/licenses/${l.id}`, { method: 'DELETE', headers: tokenHeader });
                          if (response.ok) {
                            load();
                            setToast({ message: 'Licentie succesvol verwijderd!', type: 'success' });
                          } else {
                            setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
                          }
                        } catch (error) {
                          setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
                        }
                      }}>
                        Verwijderen
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
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

      {edit && <EditModal value={edit} onClose={() => setEdit(null)} onSaved={(message) => { setEdit(null); load(); setToast({ message, type: 'success' }); }} types={types} />}

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
    expiresAt: value?.expiresAt ? new Date(value.expiresAt).toISOString().slice(0,10) : '',
  });
  const [loading, setLoading] = useState(false);
  const isNew = !value.id;
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API}/licenses` : `${API}/licenses/${value.id}`;
      const body = { ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null };
      const response = await fetch(url, { method, headers: tokenHeader, body: JSON.stringify(body) });
      
      if (response.ok) {
        onSaved(isNew ? 'Licentie succesvol aangemaakt!' : 'Licentie succesvol bijgewerkt!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Er ging iets mis');
      }
    } catch (error: any) {
      // Instead of throwing, we'll handle the error here
      console.error('License save error:', error);
      alert(`Er ging iets mis: ${error.message || 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardBody className="overflow-y-auto">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {isNew ? 'Nieuwe licentie aanmaken' : 'Licentie bewerken'}
            </h2>
            
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
              
              <FormField label="Klantnaam">
                <Input 
                  placeholder="Bedrijfsnaam of persoon" 
                  value={form.customerName || ''} 
                  onChange={(e) => setForm({...form, customerName: e.target.value})} 
                />
              </FormField>
              
              <FormField label="Klant e-mail">
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
              
              <FormField label="Domein">
                <Input 
                  placeholder="example.com of * voor wildcard" 
                  value={form.domain || ''} 
                  onChange={(e) => setForm({...form, domain: e.target.value})} 
                />
              </FormField>
              
              <FormField label="Licentie type">
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
  );
}


