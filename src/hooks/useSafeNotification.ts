import { useContext } from 'react';
import { toast } from 'sonner';

// Define the notification context type
interface NotificationContextType {
  notifications: any[];
  showNotification: (notification: any) => void;
  showSuccess: (title: string, message: string, options?: any) => void;
  showError: (title: string, message: string, options?: any) => void;
  showWarning: (title: string, message: string, options?: any) => void;
  showInfo: (title: string, message: string, options?: any) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Fallback notification methods using Sonner toast
const fallbackNotification: NotificationContextType = {
  notifications: [],
  showNotification: (notification: any) => {
    const { type = 'info', title, message, duration = 4000 } = notification;

    switch (type) {
      case 'success':
        toast.success(title, { description: message, duration });
        break;
      case 'error':
        toast.error(title, { description: message, duration });
        break;
      case 'warning':
        toast.warning(title, { description: message, duration });
        break;
      default:
        toast.info(title, { description: message, duration });
    }
  },
  showSuccess: (title: string, message: string, options = {}) => {
    toast.success(title, { description: message, duration: options.duration || 4000 });
  },
  showError: (title: string, message: string, options = {}) => {
    toast.error(title, { description: message, duration: options.duration || 4000 });
  },
  showWarning: (title: string, message: string, options = {}) => {
    toast.warning(title, { description: message, duration: options.duration || 4000 });
  },
  showInfo: (title: string, message: string, options = {}) => {
    toast.info(title, { description: message, duration: options.duration || 4000 });
  },
  removeNotification: () => {






    // Sonner handles this automatically
  }, clearAllNotifications: () => {toast.dismiss();} };export const useSafeNotification = (): NotificationContextType => {
  try {
    // Try to get the notification context from the actual provider
    const { useNotification } = require('../contexts/NotificationContext');
    const context = useNotification();
    return context;
  } catch (error) {
    // If the context is not available, use the fallback
    console.warn('NotificationProvider not found, using fallback notifications');
    return fallbackNotification;
  }
};

export default useSafeNotification;