import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { networkService } from '../services/networkService';

interface NetworkStatus {
  isOnline: boolean;
  apiAvailable: boolean;
  lastCheck: number;
}

const NetworkErrorHandler: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    apiAvailable: false,
    lastCheck: 0
  });
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);
  const [hasShownOnlineToast, setHasShownOnlineToast] = useState(false);

  useEffect(() => {
    const unsubscribe = networkService.subscribe((status) => {
      setNetworkStatus(status);

      // Show offline notification
      if (!status.isOnline && !hasShownOfflineToast) {
        toast.error('No Internet Connection', {
          description: 'You are now offline. The app will use cached data.',
          duration: 5000,
        });
        setHasShownOfflineToast(true);
        setHasShownOnlineToast(false);
      }

      // Show online notification
      if (status.isOnline && hasShownOfflineToast && !hasShownOnlineToast) {
        toast.success('Connection Restored', {
          description: 'You are back online!',
          duration: 3000,
        });
        setHasShownOnlineToast(true);
        setHasShownOfflineToast(false);
      }

      // Show API unavailable notification
      if (status.isOnline && !status.apiAvailable) {
        toast.warning('Server Unavailable', {
          description: 'Using offline data. Some features may be limited.',
          duration: 4000,
        });
      }
    });

    return unsubscribe;
  }, [hasShownOfflineToast, hasShownOnlineToast]);

  // Handle global unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Handle network-related errors
      const reason = event.reason;
      if (
        reason?.message?.includes('net::ERR_CONNECTION_REFUSED') ||
        reason?.message?.includes('Failed to fetch') ||
        reason?.code === 'NETWORK_ERROR'
      ) {
        toast.error('Connection Error', {
          description: 'Unable to connect to server. Using offline data.',
          duration: 4000,
        });
        // Prevent the error from being logged to console
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return null; // This is a behavior-only component
};

export default NetworkErrorHandler;