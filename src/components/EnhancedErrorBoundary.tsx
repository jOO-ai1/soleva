import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiHome, FiAlertTriangle, FiWifi, FiSettings } from 'react-icons/fi';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onRetry?: () => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  lastErrorTime: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Enhanced error logging
    const errorContext = {
      component: this.props.context || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      ...errorInfo
    };

    if (import.meta.env.DEV) {
      console.group('🚨 Enhanced Error Boundary');
      console.error('Error:', error);
      console.error('Context:', errorContext);
      console.groupEnd();
    }

    // Report to monitoring service (if available)
    this.reportError(error, errorContext);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Auto-retry logic for transient errors
    if (this.state.hasError && !prevState.hasError) {
      const isTransientError = this.isTransientError(this.state.error);
      if (isTransientError && this.state.retryCount < 2) {
        console.info(`🔄 Auto-retrying error recovery (attempt ${this.state.retryCount + 1}/3)`);
        this.scheduleAutoRetry();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private isTransientError = (error?: Error): boolean => {
    if (!error) return false;

    const transientPatterns = [
    'network',
    'fetch',
    'timeout',
    'connection',
    'temporary',
    'ChunkLoadError'];


    return transientPatterns.some((pattern) =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  private scheduleAutoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff

    this.retryTimeoutId = setTimeout(() => {
      console.info('🔄 Executing auto-retry...');
      this.handleRetry(true);
    }, delay);
  };

  private reportError = (error: Error, context: any) => {
    // In production, this would send to error monitoring
    if (import.meta.env.PROD) {
      console.warn('Would report error to monitoring service:', { error, context });
    }
  };

  private getErrorCategory = (): string => {
    if (!this.state.error) return 'unknown';

    const message = this.state.error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'resource';
    }
    if (message.includes('render') || message.includes('component')) {
      return 'render';
    }
    return 'application';
  };

  private getErrorSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
    const category = this.getErrorCategory();

    switch (category) {
      case 'network':return 'medium';
      case 'resource':return 'low';
      case 'render':return 'high';
      default:return 'medium';
    }
  };

  private getRecoveryOptions = () => {
    const category = this.getErrorCategory();
    const severity = this.getErrorSeverity();

    const options = [];

    // Always show retry option
    options.push({
      icon: <FiRefreshCw />,
      label: 'Retry',
      action: () => this.handleRetry(),
      primary: true
    });

    // Network-specific options
    if (category === 'network') {
      options.push({
        icon: <FiWifi />,
        label: 'Check Connection',
        action: () => window.location.reload(),
        secondary: true
      });
    }

    // Always show home option for high severity
    if (severity === 'high' || severity === 'critical') {
      options.push({
        icon: <FiHome />,
        label: 'Go Home',
        action: () => window.location.href = '/',
        secondary: true
      });
    }

    return options;
  };

  private handleRetry = (isAutoRetry = false) => {
    console.info(isAutoRetry ? '🔄 Auto-retry initiated' : '👆 Manual retry initiated');

    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private getErrorTitle = (): string => {
    const category = this.getErrorCategory();

    switch (category) {
      case 'network':return 'Connection Problem';
      case 'resource':return 'Loading Error';
      case 'render':return 'Display Error';
      default:return 'Application Error';
    }
  };

  private getErrorMessage = (): string => {
    const category = this.getErrorCategory();

    switch (category) {
      case 'network':
        return 'Unable to connect to our servers. Please check your internet connection and try again.';
      case 'resource':
        return 'Some resources failed to load. This might be temporary - please try refreshing the page.';
      case 'render':
        return 'There was a problem displaying this content. We apologize for the inconvenience.';
      default:
        return 'Something unexpected happened. Our team has been notified and is working on a fix.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const recoveryOptions = this.getRecoveryOptions();
      const errorTitle = this.getErrorTitle();
      const errorMessage = this.getErrorMessage();
      const severity = this.getErrorSeverity();

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}>

            <GlassCard className="max-w-md mx-auto text-center">
              {/* Error Icon */}
              <motion.div
                className="text-6xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}>

                <FiAlertTriangle className={`mx-auto ${
                severity === 'critical' ? 'text-red-600' :
                severity === 'high' ? 'text-red-500' :
                severity === 'medium' ? 'text-orange-500' :
                'text-yellow-500'}`
                } />
              </motion.div>
              
              {/* Error Title */}
              <motion.h1
                className={`text-2xl font-bold mb-4 ${
                severity === 'critical' || severity === 'high' ?
                'text-red-600' :
                'text-orange-600'}`
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}>

                {errorTitle}
              </motion.h1>
              
              {/* Error Message */}
              <motion.p
                className="text-gray-600 mb-6 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}>

                {errorMessage}
              </motion.p>

              {/* Retry Information */}
              {this.state.retryCount > 0 &&
              <motion.div
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5 }}>

                  <p className="text-sm text-blue-700">
                    Retry attempt: {this.state.retryCount}/3
                  </p>
                </motion.div>
              }

              {/* Recovery Options */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}>

                {recoveryOptions.map((option, index) =>
                <GlassButton
                  key={index}
                  onClick={option.action}
                  variant={option.primary ? "primary" : "secondary"}
                  className="w-full flex items-center justify-center gap-2">

                    {option.icon}
                    {option.label}
                  </GlassButton>
                )}
              </motion.div>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.props.showDetails && this.state.error &&
              <motion.details
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}>

                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 hover:text-gray-900">
                    🔧 Developer Details
                  </summary>
                  <div className="bg-gray-50 p-3 rounded border text-xs overflow-auto max-h-40">
                    <div className="font-mono text-red-800 mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo?.componentStack &&
                  <div className="font-mono text-gray-700">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack.slice(0, 500)}
                          {this.state.errorInfo.componentStack.length > 500 && '...'}
                        </pre>
                      </div>
                  }
                  </div>
                </motion.details>
              }

              {/* Help Text */}
              <motion.div
                className="mt-6 text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}>

                If the problem persists, please contact support or try again later.
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>);

    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;