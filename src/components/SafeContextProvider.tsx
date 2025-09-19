import React, { ReactNode } from 'react';
import { toast } from 'sonner';

// Fallback notification context that prevents the "useNotification must be used within a NotificationProvider" error
const FallbackNotificationProvider: React.FC<{children: ReactNode;}> = ({ children }) => {
  const fallbackContext = {
    notifications: [],
    showNotification: (notification: any) => {
      toast(notification.title, {
        description: notification.message,
        duration: notification.duration || 4000
      });
    },
    showSuccess: (title: string, message: string) => {
      toast.success(title, { description: message });
    },
    showError: (title: string, message: string) => {
      toast.error(title, { description: message });
    },
    showWarning: (title: string, message: string) => {
      toast.warning(title, { description: message });
    },
    showInfo: (title: string, message: string) => {
      toast.info(title, { description: message });
    },
    removeNotification: () => {},
    clearAllNotifications: () => {}
  };

  // Create a simple context provider
  const NotificationContext = React.createContext(fallbackContext);

  return (
    <NotificationContext.Provider value={fallbackContext}>
      {children}
    </NotificationContext.Provider>);

};

interface SafeContextProviderProps {
  children: ReactNode;
}

const SafeContextProvider: React.FC<SafeContextProviderProps> = ({ children }) => {
  return (
    <FallbackNotificationProvider>
      {children}
    </FallbackNotificationProvider>);

};

export default SafeContextProvider;