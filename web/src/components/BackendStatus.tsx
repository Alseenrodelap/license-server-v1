import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useBackendStatus } from '../hooks/useBackendStatus';

interface BackendStatusProps {
  apiUrl: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function BackendStatus({ apiUrl, onConnectionChange }: BackendStatusProps) {
  const { isConnected, error, retryCount } = useBackendStatus();
  const { t } = useI18n();

  useEffect(() => {
    onConnectionChange?.(isConnected ?? false);
  }, [isConnected, onConnectionChange]);

  // Only show a small indicator when connected, nothing when disconnected (banner handles that)
  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2">
        <div className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Online</span>
          </div>
        </div>
        <Link to="/test-license" className="bg-primary text-white px-3 py-2 rounded-full shadow-lg text-sm hover:bg-primary/90">
          Test licentie API
        </Link>
      </div>
    );
  }

  return null;
}
