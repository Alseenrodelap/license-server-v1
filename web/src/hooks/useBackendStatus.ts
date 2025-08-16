import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface BackendStatus {
  isConnected: boolean | null;
  error: string | null;
  retryCount: number;
  lastCheck: Date | null;
}

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>({
    isConnected: null,
    error: null,
    retryCount: 0,
    lastCheck: null,
  });

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setStatus(prev => ({
            ...prev,
            isConnected: true,
            error: null,
            lastCheck: new Date(),
          }));
          return;
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1,
        lastCheck: new Date(),
      }));
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval for retrying every 5 seconds
    const interval = setInterval(() => {
      if (!status.isConnected) {
        checkConnection();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Reset retry count when connection is restored
  useEffect(() => {
    if (status.isConnected && status.retryCount > 0) {
      setStatus(prev => ({ ...prev, retryCount: 0 }));
    }
  }, [status.isConnected, status.retryCount]);

  return {
    ...status,
    checkConnection,
  };
}
