import { useBackendStatus } from '../hooks/useBackendStatus';

export function BackendConnectionBanner() {
  const { isConnected, error, retryCount } = useBackendStatus();

  if (isConnected === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Verbinden met backend...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Even geduld a.u.b.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Geen verbinding met backend
              </h3>
              {error && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Fout: {error}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Opnieuw proberen... ({retryCount > 0 ? `${retryCount}x` : '1x'})
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Controleer of de backend server draait op http://localhost:4000
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
