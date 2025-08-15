import { useEffect, useMemo, useState } from 'react';
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
import { useI18n } from './i18n';
import { AppShell, Navbar, NavLink, ThemeToggle, ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon } from './components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      if (!token) {
        try {
          const res = await fetch(`${API}/auth/initialized`);
          const data = await res.json();
          if (!data.initialized) navigate('/setup', { replace: true });
        } catch {}
      }
    })();
  }, [token]);

  const isAuthed = Boolean(token);

  const topbar = useMemo(() => (
    <Navbar
      title={t('app.name')}
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
              className="form-input py-2 text-sm pr-8 appearance-none bg-white dark:bg-zinc-900"
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
        </>
      }
    />
  ), [theme, lang, isAuthed, location.pathname]);

  return (
    <AppShell topbar={topbar}>
      <Routes>
        <Route path="/login" element={<Login onLogin={(tkn) => { localStorage.setItem('token', tkn); setToken(tkn); }} />} />
        <Route path="/setup" element={<Setup onSetup={(tkn) => { localStorage.setItem('token', tkn); setToken(tkn); }} />} />
        <Route path="/terms/:slug/:version" element={<TermsPublic />} />
        <Route path="/terms/latest" element={<TermsPublic latest />} />

        <Route path="/" element={isAuthed ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/licenses" element={isAuthed ? <Licenses /> : <Navigate to="/login" replace />} />
        <Route path="/license-types" element={isAuthed ? <LicenseTypes /> : <Navigate to="/login" replace />} />
        <Route path="/terms" element={isAuthed ? <Terms /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isAuthed ? <Settings /> : <Navigate to="/login" replace />} />
        <Route path="/users" element={isAuthed ? <Users /> : <Navigate to="/login" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
