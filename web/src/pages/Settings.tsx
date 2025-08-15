import { useEffect, useRef, useState } from 'react';
import { setPrimaryColor } from '../theme';
import { PageHeader, Card, CardBody, Input, Select, Button, FormField, Textarea, Toast } from '../components/ui';
import { CogIcon, EnvelopeIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Settings(){
  const [settings, setSettings] = useState<any>({});
  const [testTo, setTestTo] = useState('');
  const [template, setTemplate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = async ()=>{
    const res = await fetch(`${API}/settings`, { headers: { Authorization: tokenHeader.Authorization } });
    const s = await res.json();
    setSettings(s);
    setTestTo(s.SMTP_TEST_TO || '');
    setTemplate(s.EMAIL_TEMPLATE_LICENSE || '');
    if (s.PRIMARY_COLOR) setPrimaryColor(s.PRIMARY_COLOR);
  };
  useEffect(()=>{ load(); },[]);

  const placeholders = ['{{customer_name}}','{{license_code}}','{{license_type}}','{{domain}}','{{status}}','{{expires_at}}','{{terms_url}}'];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Instellingen" 
        subtitle="Configureer uw applicatie-instellingen"
      />

      {/* Algemene instellingen */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
              <CogIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Algemene instellingen</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FormField label="Applicatienaam">
              <Input 
                value={settings.APP_NAME || ''} 
                onChange={(e) => setSettings({...settings, APP_NAME: e.target.value})} 
                placeholder="License Server v1"
              />
            </FormField>
            
            <FormField label="Primaire kleur">
              <div className="flex gap-2">
                <Input 
                  type="color"
                  value={settings.PRIMARY_COLOR || '#2563eb'} 
                  onChange={(e) => { 
                    setSettings({...settings, PRIMARY_COLOR: e.target.value}); 
                    setPrimaryColor(e.target.value); 
                  }} 
                  className="w-16 h-10 p-1"
                />
                <Input 
                  value={settings.PRIMARY_COLOR || '#2563eb'} 
                  onChange={(e) => { 
                    setSettings({...settings, PRIMARY_COLOR: e.target.value}); 
                    setPrimaryColor(e.target.value); 
                  }} 
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </FormField>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={async () => { 
                try {
                  const response = await fetch(`${API}/settings`, { 
                    method: 'POST', 
                    headers: tokenHeader, 
                    body: JSON.stringify({ 
                      APP_NAME: settings.APP_NAME, 
                      PRIMARY_COLOR: settings.PRIMARY_COLOR 
                    }) 
                  }); 
                  if (response.ok) {
                    load(); 
                    setToast({ message: 'Algemene instellingen opgeslagen!', type: 'success' });
                  } else {
                    setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                  }
                } catch (error) {
                  setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                }
              }}
            >
              Opslaan
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* SMTP instellingen */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg">
              <EnvelopeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">SMTP instellingen</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <FormField label="SMTP Host">
              <Input 
                value={settings.SMTP_HOST || ''} 
                onChange={(e) => setSettings({...settings, SMTP_HOST: e.target.value})} 
                placeholder="smtp.gmail.com"
              />
            </FormField>
            
            <FormField label="SMTP Port">
              <Input 
                type="number"
                value={settings.SMTP_PORT || ''} 
                onChange={(e) => setSettings({...settings, SMTP_PORT: e.target.value})} 
                placeholder="587"
              />
            </FormField>
            
            <FormField label="Secure (SSL/TLS)">
              <Select 
                value={settings.SMTP_SECURE || 'false'} 
                onChange={(e) => setSettings({...settings, SMTP_SECURE: e.target.value})}
              >
                <option value="false">Nee</option>
                <option value="true">Ja</option>
              </Select>
            </FormField>
            
            <FormField label="Username">
              <Input 
                value={settings.SMTP_USER || ''} 
                onChange={(e) => setSettings({...settings, SMTP_USER: e.target.value})} 
                placeholder="gebruiker@gmail.com"
              />
            </FormField>
            
            <FormField label="Wachtwoord">
              <Input 
                type="password"
                value={settings.SMTP_PASS || ''} 
                onChange={(e) => setSettings({...settings, SMTP_PASS: e.target.value})} 
                placeholder="••••••••"
              />
            </FormField>
            
            <FormField label="From adres">
              <Input 
                value={settings.SMTP_FROM || ''} 
                onChange={(e) => setSettings({...settings, SMTP_FROM: e.target.value})} 
                placeholder="noreply@bedrijf.nl"
              />
            </FormField>
          </div>
          
          <div className="flex items-end gap-3 mb-4">
            <FormField label="Test e-mailadres">
              <Input 
                value={testTo} 
                onChange={(e) => setTestTo(e.target.value)} 
                placeholder="test@bedrijf.nl"
                className="w-48"
              />
            </FormField>
            <Button 
              variant="secondary" 
              onClick={async () => { 
                try {
                  const response = await fetch(`${API}/settings/test-email`, { 
                    method: 'POST', 
                    headers: tokenHeader, 
                    body: JSON.stringify({ to: testTo }) 
                  }); 
                  if (response.ok) {
                    setToast({ message: 'Test e-mail succesvol verstuurd!', type: 'success' });
                  } else {
                    setToast({ message: 'Er ging iets mis bij het versturen van de test e-mail', type: 'error' });
                  }
                } catch (error) {
                  setToast({ message: 'Er ging iets mis bij het versturen van de test e-mail', type: 'error' });
                } 
              }}
            >
              Test versturen
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={async () => { 
                try {
                  const response = await fetch(`${API}/settings`, { 
                    method: 'POST', 
                    headers: tokenHeader, 
                    body: JSON.stringify(settings) 
                  }); 
                  if (response.ok) {
                    setToast({ message: 'SMTP instellingen opgeslagen!', type: 'success' });
                  } else {
                    setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                  }
                } catch (error) {
                  setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                }
              }}
            >
              SMTP opslaan
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* E-mail template */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
              <PaintBrushIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">E-mail template</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <FormField label="Template voor licentie e-mails">
                <Textarea 
                  ref={templateRef}
                  rows={12} 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)} 
                  placeholder="Beste {{customer_name}}, uw licentie {{license_code}} is aangemaakt..."
                />
              </FormField>
            </div>
            
            <div>
              <FormField label="Beschikbare placeholders">
                <div className="space-y-2">
                  {placeholders.map(p => (
                    <Button 
                      key={p} 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-left font-mono text-xs"
                      onClick={() => { 
                        const ta = templateRef.current; 
                        if (ta) { 
                          const s = ta.selectionStart; 
                          const e = ta.selectionEnd; 
                          setTemplate(t => t.slice(0, s) + p + t.slice(e)); 
                          setTimeout(() => { 
                            ta.focus(); 
                            ta.setSelectionRange(s + p.length, s + p.length); 
                          }, 10); 
                        } 
                      }}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </FormField>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              variant="primary" 
              onClick={async () => { 
                try {
                  const response = await fetch(`${API}/settings`, { 
                    method: 'POST', 
                    headers: tokenHeader, 
                    body: JSON.stringify({ EMAIL_TEMPLATE_LICENSE: template }) 
                  }); 
                  if (response.ok) {
                    load(); 
                    setToast({ message: 'Email template opgeslagen!', type: 'success' });
                  } else {
                    setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                  }
                } catch (error) {
                  setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
                }
              }}
            >
              Template opslaan
            </Button>
          </div>
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


