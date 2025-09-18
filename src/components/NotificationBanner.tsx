import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationBannerProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  persistent?: boolean;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  id,
  type,
  title,
  message,
  duration = 6000,
  onClose,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Wait for animation to complete
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          button: 'text-green-600 hover:text-green-800 hover:bg-green-100'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          button: 'text-red-600 hover:text-red-800 hover:bg-red-100'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          button: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible &&
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 ${colors.bg} border-b shadow-lg`}
        role="alert"
        aria-live="polite">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${colors.text}`}>
                    {title}
                  </h3>
                  <p className={`text-sm ${colors.text} opacity-90 mt-1`}>
                    {message}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                type="button"
                onClick={handleClose}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${colors.button}`}
                aria-label="Close notification">

                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      }
    </AnimatePresence>);

};

export default NotificationBanner;