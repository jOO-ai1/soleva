import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if ((this as any).props.fallback) {
        return (this as any).props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

                Refresh Page
              </button>
              <button
                onClick={() => (this as any).setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">

                Try Again
              </button>
            </div>
            {import.meta.env.DEV && this.state.error &&
            <details className="mt-4 p-3 bg-gray-100 rounded-md">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            }
          </div>
        </div>);

    }

    return (this as any).props.children;
  }
}

// API Error Display Component
interface ApiErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorDisplay({ error, onRetry, className = '' }: ApiErrorDisplayProps) {
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.status === 0) return 'Network error. Please check your connection.';
    if (error?.status >= 500) return 'Server error. Please try again later.';
    if (error?.status === 404) return 'The requested resource was not found.';
    if (error?.status === 403) return 'You do not have permission to access this resource.';
    if (error?.status === 401) return 'Please log in to continue.';
    return 'An unexpected error occurred. Please try again.';
  };

  const isRetryable = (error: any): boolean => {
    if (error?.status === 0) return true; // Network error
    if (error?.status >= 500) return true; // Server error
    return false;
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {error?.status === 0 ? 'Connection Error' : 'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{getErrorMessage(error)}</p>
          </div>
          {onRetry && isRetryable(error) &&
          <div className="mt-4">
              <button
              onClick={onRetry}
              className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">

                Try Again
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

}

// Loading Component
export function LoadingSpinner({ className = '', size = 'md' }: {className?: string;size?: 'sm' | 'md' | 'lg';}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
    </div>);

}

// Service Unavailable Component
export function ServiceUnavailable({ onRetry, className = '' }: {onRetry?: () => void;className?: string;}) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-yellow-800 mb-2">
        Service Temporarily Unavailable
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        We're experiencing some technical difficulties. Please try again in a few moments.
      </p>
      {onRetry &&
      <button
        onClick={onRetry}
        className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">

          Try Again
        </button>
      }
    </div>);

}