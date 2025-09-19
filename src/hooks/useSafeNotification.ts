
import { useContext } from 'react';
import { toast } from 'sonner';

// Safe notification hook that works without context
export const useSafeNotification = () => {
  // Try to get the full notification context if available
  let notificationContext = null;
  try {
    const { NotificationProvider } = require('../contexts/NotificationContext');
    notificationContext = useContext(NotificationProvider);
  } catch {










    // Context not available, use fallback
  }const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {// Use toast as fallback if context not available
    switch (type) {case 'success':toast.success(title, { description: message });break;case 'error':toast.error(title, { description: message });break;case 'warning':
        toast.warning(title, { description: message });
        break;
      case 'info':
        toast.info(title, { description: message });
        break;
    }
  };

  const showSuccess = (title: string, message: string) => {
    if (notificationContext) {
      notificationContext.showSuccess(title, message);
    } else {
      showNotification('success', title, message);
    }
  };

  const showError = (title: string, message: string) => {
    if (notificationContext) {
      notificationContext.showError(title, message);
    } else {
      showNotification('error', title, message);
    }
  };

  const showWarning = (title: string, message: string) => {
    if (notificationContext) {
      notificationContext.showWarning(title, message);
    } else {
      showNotification('warning', title, message);
    }
  };

  const showInfo = (title: string, message: string) => {
    if (notificationContext) {
      notificationContext.showInfo(title, message);
    } else {
      showNotification('info', title, message);
    }
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useSafeNotification;