import React from 'react';
import { useLang } from '../contexts/LangContext';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import { FiRefreshCw, FiHome, FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Only log detailed error info in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error Boundary caught error:', error, errorInfo);
    } else {
      console.error('Application error occurred:', error.message);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <GlassCard className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-6">
              <FiAlertTriangle className="mx-auto text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Application Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              Something went wrong while loading the application. This might be due to:
            </p>
            
            <div className="text-left mb-6 space-y-2">
              <div className="text-sm text-gray-500">• Network connectivity issues</div>
              <div className="text-sm text-gray-500">• API server problems</div>
              <div className="text-sm text-gray-500">• JavaScript configuration errors</div>
              <div className="text-sm text-gray-500">• Browser compatibility issues</div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error &&
            <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  ▶ Error Details
                </summary>
                <div className="bg-red-50 p-3 rounded border text-xs overflow-auto max-h-32">
                  <div className="font-mono text-red-800">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo?.componentStack &&
                <div className="mt-2 text-red-700">
                      {this.state.errorInfo.componentStack}
                    </div>
                }
                </div>
              </details>
            }
            
            <div className="flex flex-col gap-3">
              <GlassButton
                onClick={this.handleReload}
                variant="primary"
                className="w-full">

                <FiRefreshCw className="mr-2" />
                Refresh Page
              </GlassButton>
              
              <GlassButton
                onClick={this.handleGoHome}
                variant="secondary"
                className="w-full">

                <FiHome className="mr-2" />
                Go Home
              </GlassButton>
            </div>
          </GlassCard>
        </div>);

    }

    return this.props.children;
  }
}

export default AppErrorBoundary;