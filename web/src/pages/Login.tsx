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
      const res = await fetch(`${API}/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }) 
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.error || 'Ongeldige inloggegevens.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Er ging iets mis bij het verbinden met de server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      submit();
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardBody className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{appName}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Log in op uw account</p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="E-mailadres">
              <Input 
                type="email" 
                placeholder="naam@bedrijf.nl" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </FormField>
            
            <FormField label="Wachtwoord">
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </FormField>
            
            <Button 
              type="submit"
              variant="primary" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </form>
          
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
            <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Als het e-mailadres bestaat, is er een reset link verstuurd.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
