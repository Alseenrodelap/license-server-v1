import { useState } from 'react';
import { Card, CardBody, Input, Button, FormField } from '../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Login({ appName, onLogin }: { appName: string; onLogin: (token: string) => void }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.token) onLogin(data.token);
      else setError(data.error || 'Ongeldige inlog.');
    } catch {
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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{appName}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Log in op uw account</p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <FormField label="E-mailadres">
              <Input 
                type="email" 
                placeholder="naam@bedrijf.nl" 
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
          </div>
          
          <Button 
            variant="primary" 
            className="w-full" 
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Inloggen...' : 'Inloggen'}
          </Button>
          
          <div className="text-center">
            <button 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={async () => {
                await fetch(`${API}/auth/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
                setSent(true);
              }}
            >
              Wachtwoord vergeten?
            </button>
          </div>
          
          {sent && (
            <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-700 dark:text-green-300 text-sm">
                Als het e-mailadres bestaat, is er een reset link verstuurd.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
