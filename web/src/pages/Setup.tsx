import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Input, Button, FormField } from '../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Setup({ onSetup }: { onSetup: (token: string) => void }){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setError(null);
    if (!name || !email || !password || !password2) {
      setError('Vul alle velden in.');
      return;
    }
    if (password !== password2) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/setup`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (data.token) {
        onSetup(data.token);
        navigate('/', { replace: true });
      } else {
        setError(data.error || 'Er ging iets mis.');
      }
    } catch (e) {
      setError('Er ging iets mis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Setup License Server</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Maak uw eerste super-admin account aan</p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <FormField label="Volledige naam">
              <Input 
                placeholder="Jan Jansen" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </FormField>
            
            <FormField label="E-mailadres">
              <Input 
                type="email" 
                placeholder="jan@bedrijf.nl" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </FormField>
            
            <FormField label="Wachtwoord">
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </FormField>
            
            <FormField label="Bevestig wachtwoord">
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password2} 
                onChange={(e) => setPassword2(e.target.value)} 
              />
            </FormField>
          </div>
          
          <Button 
            variant="primary" 
            className="w-full" 
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Account aanmaken...' : 'Account aanmaken'}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
