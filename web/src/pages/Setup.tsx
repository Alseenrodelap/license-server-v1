import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Input, Button, FormField } from '../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Setup({ appName, onSetup }: { appName: string; onSetup: (token: string) => void }){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [useExistingSecret, setUseExistingSecret] = useState(false);
  const [existingSecret, setExistingSecret] = useState('');
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
    if (useExistingSecret && (!existingSecret || existingSecret.length < 32)) {
      setError('JWT Secret moet minimaal 32 karakters lang zijn.');
      return;
    }
    setLoading(true);
    try {
      const body: any = { name, email, password };
      if (useExistingSecret && existingSecret) {
        body.existingJwtSecret = existingSecret;
      }
      
      const res = await fetch(`${API}/auth/setup`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        onSetup(data.token);
      } else {
        setError(data.error || 'Er ging iets mis bij het aanmaken van het account.');
      }
    } catch (err) {
      console.error('Setup error:', err);
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Setup {appName}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Maak uw eerste super-admin account aan</p>
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
            <FormField label="Volledige naam">
              <Input 
                placeholder="Jan Jansen" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </FormField>
            
            <FormField label="E-mailadres">
              <Input 
                type="email" 
                placeholder="jan@bedrijf.nl" 
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
            
            <FormField label="Bevestig wachtwoord">
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password2} 
                onChange={(e) => setPassword2(e.target.value)} 
                required
              />
            </FormField>
            
            {/* JWT Secret Options */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="useExistingSecret"
                  checked={useExistingSecret}
                  onChange={(e) => setUseExistingSecret(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
                <label htmlFor="useExistingSecret" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bestaande JWT Secret gebruiken (voor backup restore)
                </label>
              </div>
              
              {useExistingSecret && (
                <FormField label="JWT Secret">
                  <Input 
                    type="text" 
                    placeholder="Voer uw bestaande JWT secret in (minimaal 32 karakters)" 
                    value={existingSecret} 
                    onChange={(e) => setExistingSecret(e.target.value)} 
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Gebruik dit alleen als u een backup van een bestaande installatie terugplaatst.
                  </p>
                </FormField>
              )}
            </div>
            
            <Button 
              type="submit"
              variant="primary" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
