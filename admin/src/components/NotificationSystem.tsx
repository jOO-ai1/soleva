import React, { createContext, useContext, useState, ReactNode } from 'react';
import { notification, Alert } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationContextType {
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
  showBanner: (type: 'success' | 'error' | 'warning' | 'info', message: string, description?: string) => void;
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

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { isRTL } = useLanguage();
  const [banners, setBanners] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    description?: string;
  }>>([]);

  const showSuccess = (message: string, description?: string) => {
    notification.success({
      message,
      description,
      placement: isRTL ? 'topLeft' : 'topRight',
      duration: 4,
      style: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--primary-200)',
        borderRadius: 'var(--radius-lg)'
      }
    });
  };

  const showError = (message: string, description?: string) => {
    notification.error({
      message,
      description,
      placement: isRTL ? 'topLeft' : 'topRight',
      duration: 6,
      style: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-lg)'
      }
    });
  };

  const showWarning = (message: string, description?: string) => {
    notification.warning({
      message,
      description,
      placement: isRTL ? 'topLeft' : 'topRight',
      duration: 5,
      style: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--warning)',
        borderRadius: 'var(--radius-lg)'
      }
    });
  };

  const showInfo = (message: string, description?: string) => {
    notification.info({
      message,
      description,
      placement: isRTL ? 'topLeft' : 'topRight',
      duration: 4,
      style: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--info)',
        borderRadius: 'var(--radius-lg)'
      }
    });
  };

  const showBanner = (type: 'success' | 'error' | 'warning' | 'info', message: string, description?: string) => {
    const id = Date.now().toString();
    const newBanner = { id, type, message, description };

    setBanners((prev) => [...prev, newBanner]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    }, 5000);
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  };

  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: 'var(--success)' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: 'var(--error)' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: 'var(--warning)' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: 'var(--info)' }} />;
      default:
        return <InfoCircleOutlined style={{ color: 'var(--info)' }} />;
    }
  };

  const getBannerType = (type: string): 'success' | 'error' | 'warning' | 'info' => {
    return type as 'success' | 'error' | 'warning' | 'info';
  };

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showBanner
    }}>
      {children}
      
      {/* Banner Notifications */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          [isRTL ? 'left' : 'right']: '24px',
          zIndex: 1000,
          maxWidth: '400px'
        }}>

        {banners.map((banner) =>
        <div
          key={banner.id}
          className="animate-fade-in-up"
          style={{
            marginBottom: '12px',
            animation: 'slideInFromTop 0.3s ease-out'
          }}>

            <Alert
            message={banner.message}
            description={banner.description}
            type={getBannerType(banner.type)}
            icon={getBannerIcon(banner.type)}
            showIcon
            closable
            onClose={() => removeBanner(banner.id)}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: `1px solid var(--${banner.type === 'error' ? 'error' : banner.type === 'warning' ? 'warning' : banner.type === 'success' ? 'success' : 'info'})`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }} />

          </div>
        )}
      </div>
    </NotificationContext.Provider>);

};

// CSS for banner animations
const bannerStyles = `
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.notification-banner {
  animation: slideInFromTop 0.3s ease-out;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = bannerStyles;
  document.head.appendChild(styleSheet);
}