import React, { useState, useEffect } from 'react';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Test API connectivity
        const response = await fetch('/api/v1/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
          setError(`API returned status: ${response.status}`);
        }
      } catch (err) {
        setApiStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        // Always stop loading after 3 seconds max
        setTimeout(() => setIsLoading(false), 3000);
      }
    };

    checkApiConnection();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '2rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #d1b16a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 2rem'
          }} />
          
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>
            Loading Soleva...
          </h2>
          
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {apiStatus === 'checking' && 'Checking API connection...'}
            {apiStatus === 'connected' && 'API connected, loading app...'}
            {apiStatus === 'error' && 'API connection issue detected...'}
          </p>
          
          {apiStatus === 'error' && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Warning:</strong> API connection failed. Some features may not work properly.
              {error && <div style={{ marginTop: '0.5rem' }}>Error: {error}</div>}
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppLoader;
