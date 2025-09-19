import React, { useEffect } from 'react';
import { toast } from 'sonner';

const GlobalErrorHandler: React.FC = () => {
  useEffect(() => {
    // Handle JavaScript runtime errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      // Don't show toast for certain expected errors
      const message = event.error?.message || event.message || '';
      
      if (
        message.includes('useNotification must be used within a NotificationProvider') ||
        message.includes('ChunkLoadError') ||
        message.includes('Loading chunk') ||
        message.includes('Non-Error promise rejection captured')
      ) {
        return;
      }

      // Show user-friendly error message
      if (!message.includes('Script error')) {
        toast.error('Application Error', {
          description: 'Something went wrong, but the app should continue working.',
          duration: 4000,
        });
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      console.error('Unhandled promise rejection:', reason);
      
      // Handle network errors gracefully
      if (
        reason?.message?.includes('net::ERR_CONNECTION_REFUSED') ||
        reason?.message?.includes('Failed to fetch') ||
        reason?.message?.includes('NetworkError') ||
        reason?.offline
      ) {
        // Don't show multiple network error toasts
        return;
      }

      // Handle other promise rejections
      if (reason && typeof reason === 'object' && reason.message) {
        toast.error('Request Failed', {
          description: 'An operation failed, but you can continue using the app.',
          duration: 3000,
        });
      }

      // Prevent the error from being logged to console for known issues
      event.preventDefault();
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
};

export default GlobalErrorHandler;