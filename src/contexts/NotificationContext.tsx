import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import NotificationBanner, { NotificationType } from '../components/NotificationBanner';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
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

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      ...notification
    };

    setNotifications((prev) => [...prev, newNotification]);
  }, [generateId]);

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

  const value: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications
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