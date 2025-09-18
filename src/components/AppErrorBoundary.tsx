import * as React from 'react';
import { ServiceUnavailable } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development, use proper error reporting in production
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error Boundary caught an error:', error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Check if this is likely a network/API error
      const isNetworkError = this.state.error?.message?.includes('fetch') || 
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('API') ||
                            this.state.error?.message?.includes('CORS');

      if (isNetworkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <ServiceUnavailable 
              onRetry={() => window.location.reload()}
              className="max-w-md"
            />
          </div>
        );
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              Application Error
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
              Something went wrong while loading the application. This might be due to:
            </p>
            <ul style={{ textAlign: 'left', color: '#6c757d', marginBottom: '2rem' }}>
              <li>Network connectivity issues</li>
              <li>API server problems</li>
              <li>JavaScript configuration errors</li>
              <li>Browser compatibility issues</li>
            </ul>
            
            {this.state.error && (
              <details style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Error Details
                </summary>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    marginTop: '1rem'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
