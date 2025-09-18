import React from 'react';
const { useState, useEffect } = React;
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { HomePageSkeleton } from './SkeletonLoader';

interface AppLoaderProps {
  children: any;
}

const AppLoader = ({ children }: AppLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Show content immediately after a short delay (200ms) to allow initial render
    const showContentTimer = setTimeout(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    }, 200);

    const checkApiConnection = async () => {
      const attempt = async () => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000); // Reduced timeout
        try {
          const apiUrl = buildApiUrl(API_ENDPOINTS.PRODUCTS.LIST);
          console.log('Attempting to connect to API:', apiUrl);
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          if (cancelled) return;
          if (response.ok) {
            setApiStatus('connected');
          } else {
            setApiStatus('error');
            setError(`API returned status: ${response.status}`);
          }
        } catch (err: unknown) {
          if (cancelled) return;
          setApiStatus('error');
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error('API connection error:', err);
          setError(errorMessage);
        } finally {
          clearTimeout(id);
        }
      };

      // Single attempt with shorter timeout - don't block UI
      await attempt();
    };

    // Run API check in background without blocking UI
    checkApiConnection();

    return () => {
      cancelled = true;
      clearTimeout(showContentTimer);
    };
  }, []);

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return <>{children}</>;
};

export default AppLoader;