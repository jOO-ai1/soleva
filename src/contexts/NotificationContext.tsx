import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import NotificationBanner, { NotificationType } from '../components/NotificationBanner';
import { toast } from 'sonner';
import { errorHandler, LoggedError } from '../services/errorHandling';

export interface Notification {
  id: string;
  type: NotificationType | 'network';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  metadata?: Record<string, any>;
  errorId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message: string, options?: {duration?: number;persistent?: boolean;}) => void;
  showError: (title: string, message: string, options?: {duration?: number;persistent?: boolean;}) => void;
  showWarning: (title: string, message: string, options?: {duration?: number;persistent?: boolean;}) => void;
  showInfo: (title: string, message: string, options?: {duration?: number;persistent?: boolean;}) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notifyError: (error: Error | LoggedError, context?: any) => void;
  notifyNetworkError: (error: any, retryAction?: () => void) => string;
  notifySuccess: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen to error handler for automatic error notifications
  useEffect(() => {
    const unsubscribe = errorHandler.subscribe((error: LoggedError) => {
      // Only notify for high severity errors or network errors
      if (error.severity === 'high' || error.severity === 'critical' || error.category === 'network') {
        notifyError(error);
      }
    });

    return unsubscribe;
  }, []);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      ...notification
    };

    // Check if we already have this error notification
    if (notification.errorId) {
      const existingError = notifications.find(n => n.errorId === notification.errorId);
      if (existingError) {
        return id; // Don't duplicate error notifications
      }
    }

    setNotifications((prev) => {
      // Limit total notifications
      const updated = [...prev, newNotification];
      return updated.slice(-10); // Keep only last 10
    });

    // Show toast with enhanced styling
    const toastOptions = {
      description: notification.message,
      duration: notification.persistent ? Infinity : (notification.duration || 5000),
      action: notification.actions?.length ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action,
      } : undefined,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'info':
        toast.info(notification.title, toastOptions);
        break;
      case 'network':
        toast.error(`🌐 ${notification.title}`, {
          ...toastOptions,
          className: 'border-orange-200 bg-orange-50',
        });
        break;
    }

    // Auto remove after duration (unless persistent)
    if (!notification.persistent && notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, [notifications, generateId]);

  const showSuccess = useCallback((
  title: string,
  message: string,
  options: {duration?: number;persistent?: boolean;} = {}) =>
  {
    showNotification({
      type: 'success',
      title,
      message,
      duration: options.duration,
      persistent: options.persistent
    });
  }, [showNotification]);

  const showError = useCallback((
  title: string,
  message: string,
  options: {duration?: number;persistent?: boolean;} = {}) =>
  {
    showNotification({
      type: 'error',
      title,
      message,
      duration: options.duration,
      persistent: options.persistent
    });
  }, [showNotification]);

  const showWarning = useCallback((
  title: string,
  message: string,
  options: {duration?: number;persistent?: boolean;} = {}) =>
  {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: options.duration,
      persistent: options.persistent
    });
  }, [showNotification]);

  const showInfo = useCallback((
  title: string,
  message: string,
  options: {duration?: number;persistent?: boolean;} = {}) =>
  {
    showNotification({
      type: 'info',
      title,
      message,
      duration: options.duration,
      persistent: options.persistent
    });
  }, [showNotification]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const notifyError = useCallback((error: Error | LoggedError, context?: any) => {
    const isLoggedError = error && typeof error === 'object' && 'severity' in error;
    const loggedError = isLoggedError ? error as LoggedError : null;
    
    const isNetworkError = error.message.includes('network') || 
                          error.message.includes('fetch') || 
                          error.message.includes('ERR_CONNECTION');

    const errorId = `error_${Date.now()}`;
    
    showNotification({
      type: isNetworkError ? 'network' : 'error',
      title: isNetworkError ? 'Connection Error' : 'Error',
      message: error.message || 'An unexpected error occurred',
      duration: isNetworkError ? 10000 : 7000,
      errorId,
      metadata: {
        context,
        severity: loggedError?.severity || 'medium',
        category: loggedError?.category || 'unknown',
        recoverable: loggedError?.recoverable || false
      },
      actions: isNetworkError ? [
        {
          label: 'Retry',
          action: () => {
            console.log('Retry action triggered');
            window.location.reload();
          },
          variant: 'default'
        }
      ] : undefined
    });
  }, [showNotification]);

  const notifyNetworkError = useCallback((error: any, retryAction?: () => void) => {
    const errorId = `network_${Date.now()}`;
    
    showNotification({
      type: 'network',
      title: 'Connection Problem',
      message: navigator.onLine 
        ? 'Unable to connect to our servers. Please try again.'
        : 'No internet connection. Please check your connection and try again.',
      duration: 0, // Keep until manually dismissed or resolved
      persistent: true,
      errorId,
      actions: [
        ...(retryAction ? [{
          label: 'Retry',
          action: retryAction,
          variant: 'default' as const
        }] : []),
        {
          label: 'Dismiss',
          action: () => removeNotification(errorId),
          variant: 'outline' as const
        }
      ]
    });

    return errorId;
  }, [showNotification, removeNotification]);

  const notifySuccess = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration: 4000
    });
  }, [showNotification]);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
    notifyError,
    notifyNetworkError,
    notifySuccess
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render notifications */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        {notifications.map((notification, index) =>
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 50 - index
          }}>

            <NotificationBanner
            {...notification}
            onClose={removeNotification} />

          </div>
        )}
      </div>
    </NotificationContext.Provider>);

};