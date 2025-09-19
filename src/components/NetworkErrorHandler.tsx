import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Server, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { errorHandler } from '../services/errorHandling';

interface NetworkErrorProps {
  error: any;
  retry: () => void;
  fallback?: React.ReactNode;
  context?: string;
}

export const NetworkErrorHandler: React.FC<NetworkErrorProps> = ({
  error,
  retry,
  fallback,
  context = 'Unknown'
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<number>(0);
  const maxRetries = 5;
  const retryDelay = [1000, 2000, 4000, 8000, 15000]; // Progressive backoff

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Internet connection restored');

      // Auto-retry when connection is restored (with delay to ensure stability)
      if (retryCount < maxRetries) {
        setTimeout(() => {
          handleRetry();
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('📵 Internet connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryCount]);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      toast.error(`❌ Maximum retry attempts reached. Please refresh the page.`);
      return;
    }

    // Prevent rapid retries
    const now = Date.now();
    const timeSinceLastRetry = now - lastRetryTime;
    const requiredDelay = retryDelay[Math.min(retryCount, retryDelay.length - 1)];

    if (timeSinceLastRetry < requiredDelay) {
      const remainingTime = Math.ceil((requiredDelay - timeSinceLastRetry) / 1000);
      toast.info(`⏱️ Please wait ${remainingTime} seconds before retrying`);
      return;
    }

    setIsRetrying(true);
    setLastRetryTime(now);
    const currentRetry = retryCount + 1;
    setRetryCount(currentRetry);

    // Log retry attempt
    errorHandler.logError(
      `Retry attempt ${currentRetry}/${maxRetries} for network error`,
      {
        component: 'NetworkErrorHandler',
        action: 'retry_attempt',
        context,
        metadata: {
          originalError: error?.message,
          isOnline,
          retryCount: currentRetry
        }
      },
      'medium'
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
      await retry();

      toast.success(`✅ Connection restored successfully`);
      setRetryCount(0); // Reset on success
      setLastRetryTime(0);
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      toast.error(`❌ Retry ${currentRetry}/${maxRetries} failed: ${errorMessage}`);

      // Log failed retry
      errorHandler.handleNetworkError(err, {
        component: 'NetworkErrorHandler',
        action: 'retry_failed',
        context,
        metadata: { retryCount: currentRetry }
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorType = () => {
    const message = error?.message?.toLowerCase() || '';

    if (!isOnline) return 'offline';
    if (message.includes('err_connection_refused')) return 'server_down';
    if (message.includes('timeout') || message.includes('request timeout')) return 'timeout';
    if (message.includes('fetch') || message.includes('networkerror')) return 'network';
    if (message.includes('cors')) return 'cors';
    return 'unknown';
  };

  const getErrorDetails = () => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'offline':
        return {
          icon: <WifiOff className="h-5 w-5 text-red-500" />,
          title: 'No Internet Connection',
          description: 'Please check your internet connection and try again.',
          color: 'red'
        };
      case 'server_down':
        return {
          icon: <Server className="h-5 w-5 text-orange-500" />,
          title: 'Server Unavailable',
          description: 'Our servers are currently unavailable. This is usually temporary.',
          color: 'orange'
        };
      case 'timeout':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          title: 'Request Timeout',
          description: 'The request took too long to complete. Please try again.',
          color: 'yellow'
        };
      case 'network':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          title: 'Network Error',
          description: 'Unable to connect to our services. Please check your connection.',
          color: 'orange'
        };
      case 'cors':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          title: 'Access Blocked',
          description: 'Request blocked by browser security. Please try refreshing the page.',
          color: 'red'
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          title: 'Connection Issue',
          description: 'Something went wrong with the connection. Please try again.',
          color: 'orange'
        };
    }
  };

  const errorType = getErrorType();

  // Only handle network-related errors
  if (errorType === 'unknown' && isOnline) {
    return null;
  }

  // Use custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  const errorDetails = getErrorDetails();
  const bgColor = `bg-${errorDetails.color}-50`;
  const borderColor = `border-${errorDetails.color}-200`;
  const textColor = `text-${errorDetails.color}-800`;
  const buttonColor = `text-${errorDetails.color}-700 bg-${errorDetails.color}-100 hover:bg-${errorDetails.color}-200`;
  const statusColor = `text-${errorDetails.color}-600`;

  const canRetry = isOnline || errorType !== 'offline';
  const isRetryDisabled = isRetrying || retryCount >= maxRetries || !canRetry;

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 my-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {errorDetails.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {errorDetails.title}
          </h3>
          <div className={`mt-2 text-sm ${textColor.replace('800', '700')}`}>
            <p>{errorDetails.description}</p>
            {context &&
            <p className="mt-1 text-xs">Context: {context}</p>
            }
          </div>
          
          {/* Action buttons and status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetry}
                disabled={isRetryDisabled}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${errorDetails.color}-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}>

                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' :
                retryCount >= maxRetries ? 'Max retries reached' :
                `Retry${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`}
              </button>
              
              {retryCount >= maxRetries &&
              <button
                onClick={() => window.location.reload()}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${buttonColor}`}>

                  Reload Page
                </button>
              }
            </div>

            {/* Connection status indicator */}
            <div className={`flex items-center text-xs ${statusColor}`}>
              {isOnline ?
              <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </> :

              <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              }
            </div>
          </div>

          {/* Progressive retry info */}
          {retryCount > 0 && retryCount < maxRetries &&
          <div className="mt-2 text-xs text-gray-600">
              Next retry available in {Math.ceil(retryDelay[Math.min(retryCount, retryDelay.length - 1)] / 1000)} seconds
            </div>
          }
        </div>
      </div>
    </div>);

};