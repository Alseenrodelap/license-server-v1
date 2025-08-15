import { ReactNode, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon, ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon } from '@heroicons/react/24/outline';

export function AppShell({ topbar, children }: { topbar: ReactNode; children: ReactNode }){
  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100">
      {topbar}
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}

export function Navbar({ title, nav, actions }: { title: ReactNode; nav?: ReactNode; actions?: ReactNode }){
  return (
    <div className="sticky top-0 z-50 glass-card mb-1">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </div>
          {nav && <nav className="flex items-center gap-1">{nav}</nav>}
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>
    </div>
  );
}

export function NavLink({ to, children, icon: Icon, active }: { to: string; children: ReactNode; icon?: any; active?: boolean }){
  return (
    <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

export function Button({ children, variant='primary', size='md', icon: Icon, ...props }: any){
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button className={`btn btn-${variant} ${sizes[size]}`} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }){
  return <div className={`gradient-card ${className}`}>{children}</div>;
}
export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }){
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function StatsCard({ title, value, change, icon: Icon, color = 'blue' }: any){
  const colors: any = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-950/50',
    green: 'text-green-600 bg-green-100 dark:bg-green-950/50',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-950/50',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-950/50',
  };
  
  return (
    <div className="stat-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
  <input ref={ref} {...props} className={`form-input ${props.className || ''}`} />
));

export const Select = forwardRef<HTMLSelectElement, any>((props, ref) => (
  <select ref={ref} {...props} className={`form-input ${props.className || ''}`} />
));

export const Textarea = forwardRef<HTMLTextAreaElement, any>((props, ref) => (
  <textarea ref={ref} {...props} className={`form-input ${props.className || ''}`} />
));

export function FormField({ label, children, error }: { label: string; children: ReactNode; error?: string }){
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function ThemeToggle({ theme, onToggle }: { theme: 'light'|'dark'; onToggle: ()=>void }){
  return (
    <Button variant="secondary" onClick={onToggle} size="sm" aria-label="Theme">
      {theme === 'dark' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </Button>
  );
}

export function Table({ children }: { children: ReactNode }){
  return (
    <div className="glass-card overflow-hidden">
      <table className="table-modern">{children}</table>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }){
  return (
    <div className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Toast component for feedback
export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-sm border ${
      type === 'success' 
        ? 'bg-green-50/90 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : 'bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Copy to clipboard helper
export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}

// Modal component
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e: any) => e.stopPropagation()}>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}

// Export commonly used icons
export { ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon };
