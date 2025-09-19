import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiMinimize2, FiMaximize2, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useLang } from '../contexts/LangContext';
import { useToast } from '../contexts/ToastContext';
import { getChatApiUrl, getApiTimeout } from '../config/environment';

interface ChatDockProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface ChatStatus {
  isConnected: boolean;
  isAvailable: boolean;
  mode: 'AI' | 'HUMAN';
  queuePosition?: number;
  message?: string;
}

const ChatDock: React.FC<ChatDockProps> = ({ isOpen, onToggle, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [status, setStatus] = useState<ChatStatus>({
    isConnected: false,
    isAvailable: true,
    mode: 'AI'
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const { lang } = useLang();
  const { showToast } = useToast();

  const checkConnectionStatus = useCallback(async () => {
    if (!isOpen) return;

    setIsConnecting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${getChatApiUrl()}/chat/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setStatus({
          isConnected: true,
          isAvailable: data.available || true,
          mode: data.mode || 'AI',
          queuePosition: data.queuePosition,
          message: data.message
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.info('🔄 Chat service status check failed, using offline mode:', error instanceof Error ? error.message : 'Unknown error');

      setStatus({
        isConnected: false,
        isAvailable: true,
        mode: 'AI',
        message: lang === 'ar' ?
        'تعمل المحادثة في الوضع دون اتصال' :
        'Chat is running in offline mode'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isOpen, lang]);

  // Check status when chat opens
  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
      const interval = setInterval(checkConnectionStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, checkConnectionStatus]);

  const getStatusMessage = () => {
    if (isConnecting) {
      return lang === 'ar' ? 'جاري الاتصال...' : 'Connecting...';
    }

    if (!status.isConnected) {
      return lang === 'ar' ? 'وضع دون اتصال' : 'Offline Mode';
    }

    if (status.queuePosition) {
      return lang === 'ar' ?
      `في الطابور: ${status.queuePosition}` :
      `Queue position: ${status.queuePosition}`;
    }

    if (status.mode === 'HUMAN') {
      return lang === 'ar' ? 'متصل بموظف' : 'Connected to agent';
    }

    return lang === 'ar' ? 'مساعد ذكي' : 'AI Assistant';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    if (!status.isConnected) return 'text-orange-500';
    if (status.mode === 'HUMAN') return 'text-green-500';
    return 'text-blue-500';
  };

  const handleRetryConnection = async () => {
    showToast(
      lang === 'ar' ? 'جاري إعادة المحاولة...' : 'Retrying connection...'
    );
    await checkConnectionStatus();
  };

  return (
    <div className="chat-dock">
      {/* Chat Button - shown when closed */}
      <AnimatePresence>
        {!isOpen &&
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="chat-dock-button-container">

            {/* Status indicator */}
            <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="chat-status-tooltip">

              <div className={`status-indicator ${getStatusColor()}`}>
                {status.isConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
              </div>
              <span>{getStatusMessage()}</span>
            </motion.div>

            <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className="chat-dock-button"
            aria-label={lang === 'ar' ? 'فتح المحادثة' : 'Open chat'}>

              <FiMessageCircle size={24} />
              {unreadCount > 0 &&
            <span className="unread-badge">{unreadCount}</span>
            }
            </motion.button>
          </motion.div>
        }
      </AnimatePresence>

      {/* Chat Window Header - shown when open */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="chat-dock-header">

            <div className="chat-dock-info">
              <div className="chat-status">
                <div className={`status-dot ${status.isConnected ? 'connected' : 'disconnected'}`} />
                <span className="status-text">{getStatusMessage()}</span>
              </div>
              
              {status.message &&
            <div className="status-message">
                  {status.message}
                </div>
            }
              
              {!status.isConnected &&
            <button
              onClick={handleRetryConnection}
              className="retry-button"
              disabled={isConnecting}>

                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
            }
            </div>

            <div className="chat-dock-actions">
              <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="chat-action-btn"
              aria-label={isMinimized ? lang === 'ar' ? 'توسيع' : 'Expand' : lang === 'ar' ? 'تصغير' : 'Minimize'}>

                {isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
              </button>
              
              <button
              onClick={onClose}
              className="chat-action-btn"
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>

                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <style>{`
        .chat-dock {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
        }

        .chat-dock-button-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-status-tooltip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .status-indicator {
          display: flex;
          align-items: center;
        }

        .chat-dock-button {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #d1b16a 0%, #b8965a 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(209, 177, 106, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .chat-dock-button:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 35px rgba(209, 177, 106, 0.6);
        }

        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .chat-dock-header {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 320px;
          background: var(--glass-bg);
          backdrop-filter: blur(30px);
          border: 1px solid var(--border-secondary);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .chat-dock-info {
          flex: 1;
        }

        .chat-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
        }

        .status-dot.connected {
          background: #10b981;
        }

        .status-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .status-message {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .retry-button {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: var(--primary-dark);
        }

        .retry-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-dock-actions {
          display: flex;
          gap: 4px;
        }

        .chat-action-btn {
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .chat-action-btn:hover {
          background: rgba(0, 0, 0, 0.2);
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .chat-dock {
            bottom: 16px;
            right: 16px;
          }

          .chat-status-tooltip {
            display: none;
          }

          .chat-dock-header {
            width: calc(100vw - 32px);
            right: -16px;
            bottom: 70px;
          }
        }

        /* Dark theme */
        [data-theme="dark"] .chat-dock-header {
          background: rgba(10, 10, 10, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>);

};

export default ChatDock;