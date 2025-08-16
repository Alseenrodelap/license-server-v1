import React, { ReactNode, forwardRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon, ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon, TrashIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function AppShell({ topbar, children }: { topbar: ReactNode; children: ReactNode }){
  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100">
      {topbar}
      <main className="p-6 max-w-[1600px] mx-auto">{children}</main>
    </div>
  );
}

export function Navbar({ title, nav, actions }: { title: ReactNode; nav?: ReactNode; actions?: ReactNode }){
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-50 glass-card mb-1">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </div>
            {nav && <nav className="hidden xl:flex items-center gap-1">{nav}</nav>}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-3">{actions}</div>
            {(nav || actions) && (
              <button className="xl:hidden p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setOpen(!open)} aria-label="Menu">
                {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>
        {open && (
          <div className="xl:hidden mt-4">
            {nav && <nav className="flex flex-col gap-1 mb-3">{nav}</nav>}
            <div className="flex flex-col gap-2">{actions}</div>
          </div>
        )}
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
  
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50 shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 focus:ring-zinc-500/50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50 shadow-sm',
    ghost: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 focus:ring-zinc-500/50'
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]}`} {...props}>
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

export function Table({ children, className = '', containerClassName = '' }: { children: ReactNode; className?: string; containerClassName?: string }){
  return (
    <div className={`glass-card overflow-x-auto overflow-y-hidden ${containerClassName}`}>
      <table className={`table-modern min-w-full xl:min-w-[1100px] ${className}`}>{children}</table>
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
export function Toast({ message, type = 'success', onClose, duration = 5000 }: { message: string; type?: 'success' | 'error'; onClose: () => void; duration?: number }) {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [onClose, duration]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-sm border ${
      type === 'success' 
        ? 'bg-green-50/90 dark:bg-green-950/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : 'bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70" aria-label="Close">
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

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Bevestig verwijdering", 
  message = "Weet u zeker dat u dit item wilt verwijderen?",
  confirmText = "Verwijderen",
  cancelText = "Annuleren"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="h-full">
          <CardBody className="overflow-y-auto max-h-[calc(90vh-2rem)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            </div>
            
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
            
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                {cancelText}
              </Button>
              <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>
                {confirmText}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function ErrorLogModal({ 
  isOpen, 
  onClose, 
  error, 
  title = "Error Details"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  error: any;
  title?: string;
}) {
  if (!isOpen) return null;

  const formatErrorDetails = (details: any) => {
    if (!details) return 'Geen details beschikbaar';
    
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}:\n${JSON.stringify(value, null, 2)}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="h-full">
          <div className="flex items-center gap-3 p-6 border-b border-zinc-200 dark:border-zinc-700">
            <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          </div>
          
          <CardBody className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              {error.message && (
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Error Message:</h4>
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
                  </div>
                </div>
              )}
              
              {error.details && (
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Error Details:</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                    <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap overflow-x-auto">
                      {formatErrorDetails(error.details)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
          
          <div className="flex justify-end p-6 border-t border-zinc-200 dark:border-zinc-700">
            <Button variant="secondary" onClick={onClose}>
              Sluiten
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Export commonly used icons
export { ChartBarIcon, CreditCardIcon, UserGroupIcon, DocumentTextIcon, CogIcon, KeyIcon };
