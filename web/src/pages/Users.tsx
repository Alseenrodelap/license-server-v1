import { useEffect, useState } from 'react';
import { PageHeader, Card, CardBody, Input, Select, Button, Table, FormField, Toast, Modal } from '../components/ui';
import { UserGroupIcon, PlusIcon, PencilIcon, KeyIcon, TrashIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Users(){
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name:'', email:'', password:'', role:'READ_ONLY' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user?: any; type?: 'role' | 'password' }>({ isOpen: false });
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = async () => {
    const res = await fetch(`${API}/auth/users`, { headers: { Authorization: tokenHeader.Authorization } });
    setItems((await res.json()).users);
  };
  useEffect(()=>{ load(); },[]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/users`,{ method:'POST', headers: tokenHeader, body: JSON.stringify(form) }); 
      if (response.ok) {
        setForm({ name:'', email:'', password:'', role:'READ_ONLY' }); 
        load();
        setToast({ message: 'Gebruiker succesvol aangemaakt!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het aanmaken', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het aanmaken', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch(`${API}/auth/users/${userId}`, { 
        method:'PUT', 
        headers: tokenHeader, 
        body: JSON.stringify(updates) 
      });
      if (response.ok) {
        load();
        setEditModal({ isOpen: false });
        setToast({ message: 'Gebruiker succesvol bijgewerkt!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het bijwerken', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het bijwerken', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API}/auth/users/${userId}`, { 
        method:'DELETE', 
        headers: { Authorization: tokenHeader.Authorization } 
      });
      if (response.ok) {
        load();
        setToast({ message: 'Gebruiker succesvol verwijderd!', type: 'success' });
      } else {
        setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het verwijderen', type: 'error' });
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
      SUB_ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
      READ_ONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-300'
    };
    const labels = {
      SUPER_ADMIN: 'Super Admin',
      SUB_ADMIN: 'Sub Admin', 
      READ_ONLY: 'Read Only'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colors[role as keyof typeof colors] || colors.READ_ONLY}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Gebruikers" 
        subtitle="Beheer gebruikersaccounts en toegangsrechten"
      />

      {/* Nieuwe gebruiker aanmaken */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
              <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nieuwe gebruiker aanmaken</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <FormField label="Volledige naam">
              <Input 
                value={form.name} 
                onChange={(e) => setForm({...form, name: e.target.value})} 
                placeholder="Jan Jansen"
              />
            </FormField>
            
            <FormField label="E-mailadres">
              <Input 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({...form, email: e.target.value})} 
                placeholder="jan@bedrijf.nl"
              />
            </FormField>
            
            <FormField label="Wachtwoord">
              <Input 
                type="password"
                value={form.password} 
                onChange={(e) => setForm({...form, password: e.target.value})} 
                placeholder="••••••••"
              />
            </FormField>
            
            <FormField label="Gebruikersrol">
              <Select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                <option value="READ_ONLY">Read Only</option>
                <option value="SUB_ADMIN">Sub Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </FormField>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              icon={PlusIcon}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Aanmaken...' : 'Gebruiker aanmaken'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Gebruikerslijst */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Bestaande gebruikers</h2>
          </div>
          
          <Table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mailadres</th>
                <th>Rol</th>
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={PencilIcon}
                        onClick={() => setEditModal({ isOpen: true, user: u, type: 'role' })}
                      >
                        Rol
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={KeyIcon}
                        onClick={() => setEditModal({ isOpen: true, user: u, type: 'password' })}
                      >
                        Wachtwoord
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={TrashIcon}
                        onClick={() => { 
                          if(confirm('Weet u zeker dat u deze gebruiker wilt verwijderen?')) {
                            handleDeleteUser(u.id);
                          }
                        }}
                      >
                        Verwijderen
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {items.length === 0 && (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              Nog geen gebruikers aangemaakt
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal 
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false })}
        title={editModal.type === 'role' ? 'Gebruikersrol wijzigen' : 'Wachtwoord wijzigen'}
      >
        {editModal.type === 'role' ? (
          <RoleEditForm 
            user={editModal.user}
            onSubmit={(role) => handleEditUser(editModal.user.id, { role })}
          />
        ) : (
          <PasswordEditForm 
            user={editModal.user}
            onSubmit={(password) => handleEditUser(editModal.user.id, { password })}
          />
        )}
      </Modal>

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

function RoleEditForm({ user, onSubmit }: { user: any; onSubmit: (role: string) => void }) {
  const [role, setRole] = useState(user?.role || 'READ_ONLY');
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Wijzig de rol voor gebruiker: <strong>{user?.name}</strong>
      </p>
      
      <FormField label="Nieuwe rol">
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="READ_ONLY">Read Only</option>
          <option value="SUB_ADMIN">Sub Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </Select>
      </FormField>
      
      <div className="flex gap-3 pt-4">
        <Button variant="primary" onClick={() => onSubmit(role)} className="flex-1">
          Opslaan
        </Button>
      </div>
    </div>
  );
}

function PasswordEditForm({ user, onSubmit }: { user: any; onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = () => {
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters zijn');
      return;
    }
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }
    onSubmit(password);
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nieuw wachtwoord instellen voor: <strong>{user?.name}</strong>
      </p>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      <FormField label="Nieuw wachtwoord">
        <Input 
          type="password"
          value={password} 
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }} 
          placeholder="••••••••"
        />
      </FormField>
      
      <FormField label="Bevestig wachtwoord">
        <Input 
          type="password"
          value={confirmPassword} 
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }} 
          placeholder="••••••••"
        />
      </FormField>
      
      <div className="flex gap-3 pt-4">
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={!password || !confirmPassword}
          className="flex-1"
        >
          Wachtwoord wijzigen
        </Button>
      </div>
    </div>
  );
}


