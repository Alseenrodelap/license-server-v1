import React, { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Licenses from './pages/Licenses';
import LicenseTypes from './pages/LicenseTypes';
import Terms from './pages/Terms';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Login from './pages/Login';
import Setup from './pages/Setup';
import TermsPublic from './pages/TermsPublic';
import VerifyLicense from './pages/VerifyLicense';
import TestLicense from './pages/TestLicense';
import { useI18n } from './i18n';
import { AppShell, Navbar, NavLink, ThemeToggle, ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon, Button } from './components/ui';
import { BackendStatus } from './components/BackendStatus';
import { BackendConnectionBanner } from './components/BackendConnectionBanner';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [appName, setAppName] = useState<string>('License Server');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Load app name from settings
  useEffect(() => {
    const loadAppName = async () => {
      if (token) {
        try {
          const res = await fetch(`${API}/settings`, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          const settings = await res.json();
          const name = settings.APP_NAME || 'License Server';
          setAppName(name);
          document.title = name;
        } catch (error) {
          console.error('Failed to load app name:', error);
        }
      }
    };
    loadAppName();
  }, [token]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      // Check if system is initialized
      try {
        const res = await fetch(`${API}/auth/initialized`);
        const data = await res.json();
        if (!data.initialized) {
          // System not initialized, redirect to setup
          navigate('/setup', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Failed to check if system is initialized:', error);
        // If we can't check, assume not initialized and redirect to setup
        navigate('/setup', { replace: true });
        return;
      }

      // If we have a token, verify it's still valid
      if (token) {
        try {
          const res = await fetch(`${API}/auth/verify`, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          if (!res.ok) {
            // Token is invalid, clear it and redirect to login
            localStorage.removeItem('token');
            setToken(null);
            navigate('/login', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          // If we can't verify, clear token and redirect to login
          localStorage.removeItem('token');
          setToken(null);
          navigate('/login', { replace: true });
          return;
        }
      } else {
        // No token, redirect to login
        navigate('/login', { replace: true });
      }
    })();
  }, [token, navigate]);

  const isAuthed = Boolean(token);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login', { replace: true });
  };

  const topbar = useMemo(() => (
    <Navbar
      title={appName}
      nav={isAuthed && (
        <>
          <NavLink to="/" icon={ChartBarIcon} active={location.pathname === '/'}>{t('nav.dashboard')}</NavLink>
          <NavLink to="/licenses" icon={CreditCardIcon} active={location.pathname === '/licenses'}>{t('nav.licenses')}</NavLink>
          <NavLink to="/license-types" icon={KeyIcon} active={location.pathname === '/license-types'}>{t('nav.types')}</NavLink>
          <NavLink to="/terms" icon={DocumentTextIcon} active={location.pathname === '/terms'}>{t('nav.terms')}</NavLink>
          <NavLink to="/settings" icon={CogIcon} active={location.pathname === '/settings'}>{t('nav.settings')}</NavLink>
          <NavLink to="/users" icon={UserGroupIcon} active={location.pathname === '/users'}>{t('nav.users')}</NavLink>
        </>
      )}
      actions={
        <>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          <div className="relative">
            <select
              className="form-input no-chevron py-2 text-sm pr-8 bg-white dark:bg-zinc-900"
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
            >
              <option value="nl">🇳🇱 NL</option>
              <option value="en">🇬🇧 EN</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {isAuthed && (
            <Button 
              variant="secondary" 
              size="sm" 
              icon={ArrowRightOnRectangleIcon}
              onClick={handleLogout}
              title="Uitloggen"
            >
              Uitloggen
            </Button>
          )}
        </>
      }
    />
  ), [theme, lang, isAuthed, location.pathname, appName, handleLogout]);

  return (
    <>
      <BackendStatus 
        apiUrl={API} 
        onConnectionChange={setIsBackendConnected}
      />
      <BackendConnectionBanner />
      <AppShell topbar={topbar}>
        <Routes>
          <Route path="/login" element={<Login appName={appName} onLogin={(tkn) => { localStorage.setItem('token', tkn); setToken(tkn); navigate('/', { replace: true }); }} />} />
          <Route path="/setup" element={<Setup appName={appName} onSetup={(tkn) => { localStorage.setItem('token', tkn); setToken(tkn); navigate('/', { replace: true }); }} />} />
          <Route path="/terms/:slug/:version" element={<TermsPublic />} />
          <Route path="/terms/latest" element={<TermsPublic latest />} />
          <Route path="/verify-license" element={<VerifyLicense />} />
          <Route path="/test-license" element={<TestLicense />} />

          <Route path="/" element={isAuthed ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/licenses" element={isAuthed ? <Licenses /> : <Navigate to="/login" replace />} />
          <Route path="/license-types" element={isAuthed ? <LicenseTypes /> : <Navigate to="/login" replace />} />
          <Route path="/terms" element={isAuthed ? <Terms /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={isAuthed ? <Settings onSettingsChange={setAppName} /> : <Navigate to="/login" replace />} />
          <Route path="/users" element={isAuthed ? <Users /> : <Navigate to="/login" replace />} />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
