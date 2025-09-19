import React, { Component, ReactNode, ErrorInfo } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Home, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { errorHandler, LoggedError } from '../services/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showToast?: boolean;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  loggedError?: LoggedError;
  isRetrying: boolean;
  isOnline: boolean;
}

class ComprehensiveErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      isRetrying: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
    if (this.state.hasError && !this.state.isOnline) {
      this.handleAutoRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with comprehensive context
    const loggedError = errorHandler?.handleComponentError?.(error, errorInfo, {
      component: this.props.name || 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        retryCount: this.retryCount,
        isOnline: this.state.isOnline
      }
    });
    
    this.setState({
      error,
      errorInfo,
      loggedError
    });

    // Log error for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Show user-friendly toast notification
    if (this.props.showToast !== false) {
      toast.error('Something went wrong', {
        description: 'The application encountered an error but will continue working.',
        duration: 5000
      });
    }

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  private handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    // Add delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      loggedError: undefined,
      isRetrying: false
    });
  };

  private handleAutoRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleContactSupport = () => {
    if (typeof window === 'undefined') return;
    
    // Create error report
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      component: this.props.name || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const subject = encodeURIComponent('Error Report - Soleva Website');
    const body = encodeURIComponent(`Error Details:\n${JSON.stringify(errorReport, null, 2)}`);
    window.open(`mailto:support@solevaeg.com?subject=${subject}&body=${body}`, '_blank');
  };

  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (!this.state.error) return 'medium';
    
    const message = this.state.error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) return 'high';
    if (message.includes('chunk') || message.includes('loading')) return 'medium';
    return 'high';
  }

  private getErrorIcon() {
    if (!this.state.isOnline) {
      return <WifiOff className="w-8 h-8 text-red-600" />;
    }
    
    const severity = this.getErrorSeverity();
    const color = severity === 'critical' ? 'text-red-700' : 
                  severity === 'high' ? 'text-red-600' : 'text-orange-500';
    
    return <AlertTriangle className={`w-8 h-8 ${color}`} />;
  }

  private getErrorTitle(): string {
    if (!this.state.isOnline) {
      return 'You\'re offline';
    }
    
    const error = this.state.error;
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'Connection problem';
    }
    
    return 'Something went wrong';
  }

  private getErrorDescription(): string {
    if (!this.state.isOnline) {
      return 'Check your internet connection and try again.';
    }
    
    const error = this.state.error;
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'Unable to connect to our servers. This might be a temporary issue.';
    }
    
    if (error?.message.includes('chunk') || error?.message.includes('loading')) {
      return 'Failed to load part of the application. Try refreshing the page.';
    }
    
    return 'We\'re sorry for the inconvenience. The application encountered an unexpected error.';
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with network awareness
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Connection status indicator */}
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${!this.state.isOnline ? 'bg-red-100' : 'bg-red-100'}`}>
                {this.getErrorIcon()}
              </div>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {this.getErrorTitle()}
            </h1>
            
            <p className="text-gray-600 mb-4">
              {this.getErrorDescription()}
            </p>

            {/* Network status */}
            <div className="flex items-center justify-center mb-6 text-sm">
              {this.state.isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-2" />
                  Connected
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-4 h-4 mr-2" />
                  No internet connection
                </div>
              )}
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-medium text-gray-900 mb-2">Error Details:</h3>
                <p className="text-sm text-gray-700 mb-2">{this.state.error?.message}</p>
                <p className="text-xs text-gray-600">
                  Component: {this.props.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-600">
                  Retry Count: {this.retryCount}/{this.maxRetries}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying || (!this.state.isOnline && this.retryCount >= this.maxRetries)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                {this.state.isRetrying ? 'Retrying...' : 
                 this.retryCount >= this.maxRetries ? 'Reload Page' : 
                 `Try Again (${this.maxRetries - this.retryCount} left)`}
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>

              <button
                onClick={this.handleContactSupport}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Report Issue
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Error ID: {Date.now().toString(36)}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComprehensiveErrorBoundary;