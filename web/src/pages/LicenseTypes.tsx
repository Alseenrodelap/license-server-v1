import { useEffect, useState } from 'react';
import { PageHeader, Card, CardBody, Input, Button, Table, FormField, Toast } from '../components/ui';
import { KeyIcon, PlusIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function LicenseTypes(){
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = async () => {
    const res = await fetch(`${API}/license-types`, { headers: { Authorization: tokenHeader.Authorization } });
    setItems((await res.json()).items);
  };
  useEffect(()=>{ load(); },[]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API}/license-types`, { method:'POST', headers: tokenHeader, body: JSON.stringify({ name: name.trim() }) }); 
      if (response.ok) {
        setName(''); 
        load();
        setToast({ message: 'Licentie type succesvol toegevoegd!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het toevoegen', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het toevoegen', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, newName: string) => {
    try {
      const response = await fetch(`${API}/license-types/${id}`, {
        method: 'PUT', 
        headers: tokenHeader, 
        body: JSON.stringify({ name: newName.trim() })
      });
      if (response.ok) {
        load();
        setToast({ message: 'Licentie type succesvol bijgewerkt!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het bijwerken', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het bijwerken', type: 'error' });
    }
  };

  const handleDelete = async (id: string, typeName: string) => {
    if (!confirm(`Weet u zeker dat u het licentietype "${typeName}" wilt verwijderen?`)) return;
    try {
      const response = await fetch(`${API}/license-types/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: tokenHeader.Authorization } 
      }); 
      if (response.ok) {
        load();
        setToast({ message: 'Licentie type succesvol verwijderd!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Licentie Types" 
        subtitle="Beheer de verschillende types licenties"
      />

      {/* Nieuw type aanmaken */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
              <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nieuw licentie type</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <FormField label="Type naam" className="flex-1">
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Bijv. Standard, Professional, Enterprise..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </FormField>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                icon={PlusIcon}
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                title={!name.trim() ? 'Vul eerst typenaam in' : undefined}
              >
                {loading ? 'Toevoegen...' : 'Toevoegen'}
              </Button>
              {!name.trim() && (
                <span className="text-xs text-zinc-500">Vul eerst typenaam in</span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Bestaande types */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
              <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bestaande licentie types</h2>
          </div>
          
          <Table>
            <thead>
              <tr>
                <th>Type naam</th>
                <th>Aantal licenties</th>
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-zinc-400" />
                      <Input 
                        defaultValue={t.name} 
                        onBlur={(e) => handleUpdate(t.id, e.target.value)}
                        className="border-none bg-transparent p-0 font-medium focus:bg-white dark:focus:bg-zinc-800"
                      />
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                      {t._count?.licenses ?? 0} licenties
                    </span>
                  </td>
                  <td className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={TrashIcon}
                      onClick={() => handleDelete(t.id, t.name)}
                    >
                      Verwijderen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {items.length === 0 && (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <KeyIcon className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
              <p>Nog geen licentie types aangemaakt</p>
              <p className="text-sm">Voeg hierboven uw eerste type toe</p>
            </div>
          )}
        </CardBody>
      </Card>

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
