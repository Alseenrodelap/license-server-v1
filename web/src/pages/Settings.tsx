import React, { useEffect, useRef, useState } from 'react';
import { setPrimaryColor } from '../theme';
import { PageHeader, Card, CardBody, Input, Select, Button, FormField, Textarea, Toast, ErrorLogModal } from '../components/ui';
import { CogIcon, EnvelopeIcon, PaintBrushIcon, KeyIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, CloudArrowUpIcon, CloudArrowDownIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export default function Settings({ onSettingsChange }: { onSettingsChange?: (appName: string) => void }){
  const [settings, setSettings] = useState<any>({});
  const [testTo, setTestTo] = useState('');
  const [template, setTemplate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; error: any }>({ isOpen: false, error: null });
  const templateRef = useRef<HTMLTextAreaElement>(null);

  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = async ()=>{
    setLoading(true);
    try {
      const res = await fetch(`${API}/settings`, { headers: { Authorization: tokenHeader.Authorization } });
      if (res.ok) {
        const s = await res.json();
        setSettings(s);
        setTestTo(s.SMTP_TEST_TO || '');
        setTemplate(s.EMAIL_TEMPLATE_LICENSE || '');
        if (s.PRIMARY_COLOR) setPrimaryColor(s.PRIMARY_COLOR);
        if (s.APP_NAME && onSettingsChange) {
          onSettingsChange(s.APP_NAME);
          document.title = s.APP_NAME;
        }
      } else {
        setToast({ message: 'Er ging iets mis bij het laden van de instellingen', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het laden van de instellingen', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{ load(); },[]);

  const saveSettings = async (newSettings: any, section: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/settings`, { 
        method: 'POST', 
        headers: tokenHeader, 
        body: JSON.stringify(newSettings) 
      }); 
      if (response.ok) {
        await load(); // Reload all settings to ensure consistency
        setToast({ message: `${section} opgeslagen!`, type: 'success' });
        if (newSettings.APP_NAME && onSettingsChange) {
          onSettingsChange(newSettings.APP_NAME);
          document.title = newSettings.APP_NAME;
        }
      } else {
        setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het opslaan', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testTo) {
      setToast({ message: 'Vul een e-mailadres in voor de test', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/settings/test-email`, { 
        method: 'POST', 
        headers: tokenHeader, 
        body: JSON.stringify({ to: testTo }) 
      }); 
      
      const data = await response.json();
      
      if (response.ok) {
        setToast({ message: data.message || 'Test e-mail succesvol verstuurd!', type: 'success' });
      } else {
        // Show error details in modal
        setErrorModal({ 
          isOpen: true, 
          error: {
            message: data.error || 'SMTP Test mislukt',
            details: data.details || {}
          }
        });
      }
    } catch (error) {
      console.error('SMTP Test Error:', error);
      setErrorModal({ 
        isOpen: true, 
        error: {
          message: 'Er ging iets mis bij het versturen van de test e-mail',
          details: { error: error instanceof Error ? error.message : 'Onbekende fout' }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const placeholders = ['{{customer_name}}','{{license_code}}','{{license_type}}','{{domain}}','{{status}}','{{expires_at}}','{{terms_url}}'];

  // JWT Secret Management
  const [jwtSecret, setJwtSecret] = useState<string>('');
  const [jwtSecretInfo, setJwtSecretInfo] = useState<{ isFromEnv: boolean; isGenerated: boolean }>({ isFromEnv: false, isGenerated: false });
  const [showJwtSecret, setShowJwtSecret] = useState(false);
  const [requireReauth, setRequireReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showJwtSecretInModal, setShowJwtSecretInModal] = useState(false);

  // Backup/Restore Management
  const [backupModal, setBackupModal] = useState<{ isOpen: boolean; type: 'download' | 'upload' | null }>({ isOpen: false, type: null });
  const [restoreModal, setRestoreModal] = useState<{ isOpen: boolean; backup: any; analysis: any }>({ isOpen: false, backup: null, analysis: null });
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['all']);
  const [securityLevel, setSecurityLevel] = useState<'insecure' | 'medium' | 'secure'>('medium');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [useJwtSecretFromBackup, setUseJwtSecretFromBackup] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const loadJwtSecret = async () => {
    try {
      const res = await fetch(`${API}/auth/jwt-secret`, { headers: tokenHeader });
      if (res.ok) {
        const data = await res.json();
        setJwtSecret(data.secret);
        setJwtSecretInfo({ isFromEnv: data.isFromEnv, isGenerated: data.isGenerated });
      }
    } catch (error) {
      console.error('Failed to load JWT secret info:', error);
    }
  };

  const regenerateJwtSecret = async () => {
    if (!confirm('Weet je zeker dat je de JWT secret wilt regenereren? Alle bestaande tokens worden ongeldig.')) {
      return;
    }

    const performRegenerate = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/auth/jwt-secret/regenerate`, { 
          method: 'POST', 
          headers: tokenHeader 
        });
        if (res.ok) {
          const data = await res.json();
          setJwtSecret(data.secret);
          setJwtSecretInfo({ isFromEnv: false, isGenerated: true });
          setShowJwtSecret(false);
          setToast({ message: 'JWT secret geregenereerd!', type: 'success' });
        } else {
          setToast({ message: 'Er ging iets mis bij het regenereren', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Er ging iets mis bij het regenereren', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    requireReauthForAction(performRegenerate);
  };

  const copyJwtSecret = async () => {
    if (!showJwtSecret) {
      const performCopy = async () => {
        try {
          await navigator.clipboard.writeText(jwtSecret);
          setToast({ message: 'JWT secret gekopieerd naar klembord!', type: 'success' });
          setShowJwtSecret(false);
        } catch (error) {
          setToast({ message: 'Kon JWT secret niet kopiëren', type: 'error' });
        }
      };

      requireReauthForAction(performCopy);
      return;
    }

    try {
      await navigator.clipboard.writeText(jwtSecret);
      setToast({ message: 'JWT secret gekopieerd naar klembord!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Kon JWT secret niet kopiëren', type: 'error' });
    }
  };

  const downloadJwtSecret = () => {
    if (!showJwtSecret) {
      const performDownload = () => {
        const blob = new Blob([jwtSecret], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jwt-secret.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToast({ message: 'JWT secret gedownload!', type: 'success' });
        setShowJwtSecret(false);
      };

      requireReauthForAction(performDownload);
      return;
    }

    const blob = new Blob([jwtSecret], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwt-secret.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'JWT secret gedownload!', type: 'success' });
  };

  useEffect(() => {
    loadJwtSecret();
  }, []);

  // Re-authentication function
  const handleReauth = async () => {
    if (!reauthPassword) {
      setReauthError('Voer uw wachtwoord in');
      return;
    }

    setLoading(true);
    setReauthError(null);
    
    try {
      const response = await fetch(`${API}/auth/reauth`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: tokenHeader.Authorization
        }, 
        body: JSON.stringify({ password: reauthPassword }) 
      });
      
      if (response.ok) {
        setRequireReauth(false);
        setReauthPassword('');
        setReauthError(null);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      } else {
        setReauthError('Onjuist wachtwoord');
      }
    } catch (error) {
      setReauthError('Er ging iets mis bij de authenticatie');
    } finally {
      setLoading(false);
    }
  };

  const requireReauthForAction = (action: () => void) => {
    setRequireReauth(true);
    setReauthPassword('');
    setReauthError(null);
    setPendingAction(() => action);
  };

  // Backup/Restore functions
  const downloadBackup = async () => {
    const performDownload = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('securityLevel', securityLevel);
        selectedDataTypes.forEach(type => params.append('dataTypes', type));
        
        if (securityLevel === 'secure' && encryptionKey) {
          params.append('encryptionKey', encryptionKey);
        }
        
        const response = await fetch(`${API}/auth/backup?${params}`, { 
          headers: tokenHeader 
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `license-server-backup-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          let message = 'Backup succesvol gedownload!';
          if (securityLevel === 'secure') {
            message += ' Bewaar de JWT secret veilig - deze is nodig om de backup te herstellen!';
            // Show JWT secret in modal after download
            setShowJwtSecretInModal(true);
            // Reload JWT secret to make sure it's current
            await loadJwtSecret();
          } else if (securityLevel === 'insecure') {
            message += ' ⚠️ Deze backup bevat de JWT secret - bewaar veilig!';
          }
          
          setToast({ message, type: 'success' });
          // Only close modal for non-secure backups, keep open for secure backups to show JWT secret
          if (securityLevel !== 'secure') {
            setBackupModal({ isOpen: false, type: null });
          }
        } else {
          setToast({ message: 'Er ging iets mis bij het downloaden van de backup', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Er ging iets mis bij het downloaden van de backup', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    requireReauthForAction(performDownload);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
      setUploadedFile(file);
    } else {
      setToast({ message: 'Selecteer een geldig ZIP bestand', type: 'error' });
    }
  };

  const analyzeBackup = async () => {
    if (!uploadedFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('backup', uploadedFile);
      if (encryptionKey) {
        formData.append('encryptionKey', encryptionKey);
      }
      
      const response = await fetch(`${API}/auth/restore/upload`, { 
        method: 'POST', 
        headers: { Authorization: tokenHeader.Authorization },
        body: formData
      });
      
      if (response.ok) {
        const { backup } = await response.json();
        
        const analyzeResponse = await fetch(`${API}/auth/restore/analyze`, { 
          method: 'POST', 
          headers: tokenHeader, 
          body: JSON.stringify({ backup, encryptionKey }) 
        });
        
        if (analyzeResponse.ok) {
          const analysis = await analyzeResponse.json();
          setRestoreModal({ isOpen: true, backup, analysis });
          setBackupModal({ isOpen: false, type: null });
        } else {
          setToast({ message: 'Er ging iets mis bij het analyseren van de backup', type: 'error' });
        }
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Er ging iets mis bij het uploaden van de backup', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het analyseren van de backup', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const executeRestore = async () => {
    if (!restoreModal.backup || !selectedDataTypes.length) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/restore`, { 
        method: 'POST', 
        headers: tokenHeader, 
        body: JSON.stringify({
          backup: restoreModal.backup,
          dataTypes: selectedDataTypes,
          useJwtSecret: useJwtSecretFromBackup,
          encryptionKey
        }) 
      });
      
      if (response.ok) {
        const result = await response.json();
        let message = 'Restore voltooid!';
        if (result.jwtSecretUsed) {
          message += ' JWT secret uit backup gebruikt.';
        }
        if (result.securityLevel === 'secure') {
          message += ' Versleutelde backup hersteld.';
        }
        
        setToast({ message, type: 'success' });
        setRestoreModal({ isOpen: false, backup: null, analysis: null });
        setSelectedDataTypes(['all']);
        setUseJwtSecretFromBackup(false);
        setUploadedFile(null);
        setEncryptionKey('');
        
        // Reload settings after restore
        await load();
        await loadJwtSecret();
      } else {
        setToast({ message: 'Er ging iets mis bij het uitvoeren van de restore', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Er ging iets mis bij het uitvoeren van de restore', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const dataTypeOptions = [
    { value: 'all', label: 'Alles', description: 'Alle data inclusief gebruikers, licenties, instellingen, etc.' },
    { value: 'users', label: 'Gebruikers', description: 'Alle gebruikersaccounts en rollen' },
    { value: 'licenseTypes', label: 'Licentietypes', description: 'Licentietypes en hun configuratie' },
    { value: 'licenses', label: 'Licenties', description: 'Alle uitgegeven licenties (vereist licentietypes)' },
    { value: 'terms', label: 'Voorwaarden', description: 'Algemene voorwaarden en privacybeleid' },
    { value: 'settings', label: 'Instellingen', description: 'Applicatie-instellingen en SMTP configuratie' }
  ];

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
              onClick={() => saveSettings({ 
                APP_NAME: settings.APP_NAME, 
                PRIMARY_COLOR: settings.PRIMARY_COLOR 
              }, 'Algemene instellingen')}
              disabled={loading}
            >
              {loading ? 'Opslaan...' : 'Opslaan'}
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
              onClick={handleTestEmail}
              disabled={loading}
            >
              {loading ? 'Testen...' : 'Test versturen'}
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={() => saveSettings({
                SMTP_HOST: settings.SMTP_HOST,
                SMTP_PORT: settings.SMTP_PORT,
                SMTP_SECURE: settings.SMTP_SECURE,
                SMTP_USER: settings.SMTP_USER,
                SMTP_PASS: settings.SMTP_PASS,
                SMTP_FROM: settings.SMTP_FROM,
                SMTP_TEST_TO: testTo
              }, 'SMTP instellingen')}
              disabled={loading}
            >
              {loading ? 'Opslaan...' : 'SMTP opslaan'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* JWT Secret Management */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
              <KeyIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">JWT Secret Management</h2>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Huidige JWT Secret:</span>
              {jwtSecretInfo.isFromEnv && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  Environment Variable
                </span>
              )}
              {jwtSecretInfo.isGenerated && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 text-xs rounded-full">
                  Auto-generated
                </span>
              )}
            </div>
            
            <div className="relative">
              <Input 
                value={showJwtSecret ? jwtSecret : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                readOnly
                className="font-mono text-sm pr-24"
                placeholder="Loading..."
                type={showJwtSecret ? 'text' : 'password'}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!showJwtSecret) {
                      const performShow = () => {
                        setShowJwtSecret(true);
                      };
                      requireReauthForAction(performShow);
                    } else {
                      setShowJwtSecret(false);
                    }
                  }}
                  title={showJwtSecret ? "Verberg secret" : "Toon secret"}
                >
                  {showJwtSecret ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyJwtSecret}
                  title="Kopieer naar klembord"
                  disabled={!showJwtSecret}
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadJwtSecret}
                  title="Download als bestand"
                  disabled={!showJwtSecret}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              ⚠️ Bewaar deze secret veilig. Het regenereren maakt alle bestaande tokens ongeldig.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="secondary" 
              onClick={regenerateJwtSecret}
              disabled={loading}
            >
              {loading ? 'Regenereren...' : 'Nieuwe Secret Genereren'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Backup/Restore Management */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/50 rounded-lg">
              <CloudArrowDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Backup & Restore</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Backup maken</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Download een backup van uw data. Kies welke datatypes u wilt meenemen en of de JWT secret moet worden opgenomen.
              </p>
              <Button 
                variant="primary" 
                onClick={() => {
                  setBackupModal({ isOpen: true, type: 'download' });
                  setShowJwtSecretInModal(false);
                }}
                className="w-full"
              >
                <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                Backup maken
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Backup herstellen</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Upload een backup bestand om data te herstellen. U kunt kiezen welke datatypes te herstellen.
              </p>
              <Button 
                variant="primary" 
                onClick={() => setBackupModal({ isOpen: true, type: 'upload' })}
                className="w-full"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Backup herstellen
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Belangrijke informatie</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  • Backups bevatten gevoelige data. Bewaar ze veilig.<br/>
                  • Het herstellen van data overschrijft bestaande data.<br/>
                  • Licenties hebben licentietypes nodig om correct te werken.<br/>
                  • JWT secrets in backups kunnen onveilig zijn bij verlies.
                </p>
              </div>
            </div>
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
              onClick={() => saveSettings({ EMAIL_TEMPLATE_LICENSE: template }, 'Email template')}
              disabled={loading}
            >
              {loading ? 'Opslaan...' : 'Template opslaan'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Email Templates Section */}
		<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
			<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
				E-mail Templates
			</h3>
			
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
						Verificatie E-mail Template
					</label>
					<textarea
						value={settings.EMAIL_TEMPLATE_VERIFICATION || ''}
						onChange={(e) => setSettings({...settings, EMAIL_TEMPLATE_VERIFICATION: e.target.value})}
						className="w-full h-32 p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
						placeholder={`<p>Beste {{customer_name}},</p>
<p>Er is een verzoek gedaan om uw licentie te verifiëren.</p>
<p><b>Code:</b> {{license_code}}<br/>
<b>Type:</b> {{license_type}}<br/>
<b>Domein:</b> {{domain}}</p>
<p>Klik op de onderstaande link om uw licentie te verifiëren:</p>
<p><a href="{{verification_url}}">Verificeer Licentie</a></p>
<p>Deze link is 5 minuten geldig.</p>
<p>Groet,<br/>{{app_name}}</p>`}
					/>
					<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
						Beschikbare variabelen: {'{{customer_name}}'}, {'{{license_code}}'}, {'{{license_type}}'}, {'{{domain}}'}, {'{{verification_url}}'}, {'{{app_name}}'}
					</p>
				</div>
			</div>
		</div>

      <ErrorLogModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, error: null })}
        error={errorModal.error}
        title="SMTP Test Error"
      />

      {/* Backup Download Modal */}
                  {backupModal.isOpen && backupModal.type === 'download' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setBackupModal({ isOpen: false, type: null })}>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Backup maken
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Datatypes om op te nemen:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dataTypeOptions.map(option => (
                    <label key={option.value} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDataTypes.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (option.value === 'all') {
                              setSelectedDataTypes(['all']);
                            } else {
                              setSelectedDataTypes(prev => prev.filter(t => t !== 'all').concat(option.value));
                            }
                          } else {
                            setSelectedDataTypes(prev => prev.filter(t => t !== option.value));
                          }
                        }}
                        className="mt-1 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {option.label}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Veiligheidsniveau:
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="securityLevel"
                      value="insecure"
                      checked={securityLevel === 'insecure'}
                      onChange={(e) => setSecurityLevel(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        Meest onveilig: Backup niet versleutelen en geheime sleutel opnemen
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        De JWT secret wordt in de backup opgenomen. Dit is onveilig als de backup in verkeerde handen komt.
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="securityLevel"
                      value="medium"
                      checked={securityLevel === 'medium'}
                      onChange={(e) => setSecurityLevel(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        Middel: Backup niet versleutelen maar geheime sleutel niet opnemen
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        De backup is niet versleuteld maar bevat geen JWT secret. U moet de secret handmatig beheren.
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="securityLevel"
                      value="secure"
                      checked={securityLevel === 'secure'}
                      onChange={(e) => setSecurityLevel(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        Veilig: Backup versleutelen met de JWT sleutel
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        De backup wordt versleuteld met de huidige JWT sleutel. Na download wordt de sleutel getoond.
                      </div>
                    </div>
                  </label>
                </div>
                
                {securityLevel === 'secure' && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      🔐 Veilige versleuteling
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      De backup wordt versleuteld met de huidige JWT sleutel. Na het downloaden wordt de JWT sleutel getoond - 
                      bewaar deze veilig, want u heeft deze nodig om de backup te herstellen.
                    </p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Wat is de JWT Secret?
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    De JWT Secret is een geheime sleutel die wordt gebruikt om beveiligings-tokens te ondertekenen. 
                    Deze tokens worden gebruikt om gebruikers te authenticeren. Als deze sleutel wordt gecompromitteerd, 
                    kunnen alle bestaande tokens ongeldig worden gemaakt.
                  </p>
                </div>
              </div>
            </div>
            
            {showJwtSecretInModal && securityLevel === 'secure' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                  🔐 JWT Secret voor Backup Herstel
                </h4>
                <div className="relative">
                  <Input 
                    value={jwtSecret}
                    readOnly
                    className="font-mono text-sm pr-24 bg-white dark:bg-zinc-900"
                    type="text"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(jwtSecret);
                          setToast({ message: 'JWT secret gekopieerd naar klembord!', type: 'success' });
                        } catch (error) {
                          setToast({ message: 'Kon JWT secret niet kopiëren', type: 'error' });
                        }
                      }}
                      title="Kopieer naar klembord"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([jwtSecret], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'jwt-secret.txt';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setToast({ message: 'JWT secret gedownload!', type: 'success' });
                      }}
                      title="Download als bestand"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Bewaar deze JWT secret veilig - u heeft deze nodig om de backup te herstellen!
                </p>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setBackupModal({ isOpen: false, type: null });
                  setShowJwtSecretInModal(false);
                }}
                className="flex-1"
              >
                {showJwtSecretInModal ? 'Sluiten' : 'Annuleren'}
              </Button>
              {!showJwtSecretInModal && (
                <Button 
                  variant="primary" 
                  onClick={downloadBackup}
                  disabled={loading || selectedDataTypes.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Downloaden...' : 'Downloaden'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Upload Modal */}
                  {backupModal.isOpen && backupModal.type === 'upload' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setBackupModal({ isOpen: false, type: null })}>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Backup bestand uploaden
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Selecteer backup bestand:
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-950/50 dark:file:text-blue-300"
                />
                {uploadedFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ {uploadedFile.name} geselecteerd
                  </p>
                )}
                
                <div className="mt-4">
                  <FormField label="JWT Secret (indien nodig)">
                    <Input 
                      type="password"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Voer de JWT secret in als de backup versleuteld is"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Alleen nodig als de backup versleuteld is gemaakt met de JWT secret.
                    </p>
                  </FormField>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setBackupModal({ isOpen: false, type: null });
                  setUploadedFile(null);
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button 
                variant="primary" 
                onClick={analyzeBackup}
                disabled={loading || !uploadedFile}
                className="flex-1"
              >
                {loading ? 'Analyseren...' : 'Analyseren'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Analysis Modal */}
                  {restoreModal.isOpen && restoreModal.analysis && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setRestoreModal({ isOpen: false, analysis: null, backup: null })}>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Backup analyse
            </h3>
            
            <div className="space-y-6">
              {/* Backup Info */}
              <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-4">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Backup informatie</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Versie:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100">{restoreModal.analysis.version}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Gemaakt op:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                      {new Date(restoreModal.analysis.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Veiligheidsniveau:</span>
                    <span className={`ml-2 ${
                      restoreModal.analysis.securityLevel === 'secure' ? 'text-green-600 dark:text-green-400' :
                      restoreModal.analysis.securityLevel === 'insecure' ? 'text-red-600 dark:text-red-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {restoreModal.analysis.securityLevel === 'secure' ? 'Veilig (versleuteld met JWT secret)' :
                       restoreModal.analysis.securityLevel === 'insecure' ? 'Onveilig (JWT secret inbegrepen)' :
                       'Middel (niet versleuteld)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">JWT Secret:</span>
                    <span className={`ml-2 ${restoreModal.analysis.hasJwtSecret ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {restoreModal.analysis.hasJwtSecret ? 'Aanwezig' : 'Niet aanwezig'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Types */}
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">Beschikbare datatypes</h4>
                <div className="space-y-2">
                  {Object.entries(restoreModal.analysis.dataTypes).map(([key, value]: [string, any]) => (
                    <label key={key} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDataTypes.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (key === 'all') {
                              setSelectedDataTypes(['all']);
                            } else {
                              setSelectedDataTypes(prev => prev.filter(t => t !== 'all').concat(key));
                            }
                          } else {
                            setSelectedDataTypes(prev => prev.filter(t => t !== key));
                          }
                        }}
                        disabled={!value.exists}
                        className="mt-1 rounded border-zinc-300 dark:border-zinc-600 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {dataTypeOptions.find(opt => opt.value === key)?.label || key}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {value.exists ? `${value.count} items gevonden` : 'Niet aanwezig in backup'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {Object.values(restoreModal.analysis.dependencies).some(Boolean) && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Afhankelijkheden</h4>
                  <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    {restoreModal.analysis.dependencies.licensesNeedLicenseTypes && (
                      <p>⚠️ Licenties gevonden maar geen licentietypes. Licenties kunnen niet correct werken.</p>
                    )}
                    {restoreModal.analysis.dependencies.licensesNeedUsers && (
                      <p>⚠️ Licenties gevonden maar geen gebruikers. Sommige functionaliteit kan beperkt zijn.</p>
                    )}
                  </div>
                </div>
              )}

              {/* JWT Secret Option */}
              {restoreModal.analysis.hasJwtSecret && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useJwtSecretFromBackup}
                      onChange={(e) => setUseJwtSecretFromBackup(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      JWT Secret uit backup gebruiken
                    </span>
                  </label>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    ⚠️ Dit overschrijft de huidige JWT secret en maakt alle bestaande tokens ongeldig!
                  </p>
                </div>
              )}
              
              {!restoreModal.analysis.hasJwtSecret && restoreModal.analysis.securityLevel !== 'secure' && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    JWT Secret niet gevonden
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Deze backup bevat geen JWT secret. U moet handmatig een JWT secret instellen na het herstellen, 
                    of een backup gebruiken die wel een JWT secret bevat.
                  </p>
                </div>
              )}
              
              {restoreModal.analysis.securityLevel === 'secure' && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    🔐 Versleutelde backup
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Deze backup is versleuteld met de JWT secret. Voer de JWT secret in het veld hierboven in om de backup te ontsleutelen.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setRestoreModal({ isOpen: false, backup: null, analysis: null });
                  setSelectedDataTypes(['all']);
                  setUseJwtSecretFromBackup(false);
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button 
                variant="primary" 
                onClick={executeRestore}
                disabled={loading || selectedDataTypes.length === 0}
                className="flex-1"
              >
                {loading ? 'Herstellen...' : 'Herstellen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Re-authentication Modal */}
      {requireReauth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => {
          setRequireReauth(false);
          setReauthPassword('');
          setReauthError(null);
        }}>
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Extra beveiliging vereist
            </h3>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Voor deze actie is extra authenticatie vereist. Voer uw wachtwoord in om door te gaan.
            </p>
            
            <FormField label="Wachtwoord">
              <Input 
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Voer uw wachtwoord in"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleReauth();
                  }
                }}
              />
            </FormField>
            
            {reauthError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {reauthError}
              </p>
            )}
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setRequireReauth(false);
                  setReauthPassword('');
                  setReauthError(null);
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
                              <Button 
                variant="primary" 
                onClick={handleReauth}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Verifiëren...' : 'Verifiëren'}
              </Button>
            </div>
          </div>
        </div>
      )}

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


