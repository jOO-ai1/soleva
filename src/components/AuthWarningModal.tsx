import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import GlassButton from './GlassButton';
import clsx from 'clsx';

interface AuthWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  type: 'login_required' | 'account_not_found';
  action?: string; // Optional action description for context
}

export default function AuthWarningModal({
  isOpen,
  onClose,
  onLogin,
  onSignUp,
  type,
  action
}: AuthWarningModalProps) {
  const { lang } = useLang();
  const t = useTranslation();
  const { theme } = useTheme();

  const isRTL = lang === 'ar';

  const getModalContent = () => {
    if (type === 'login_required') {
      return {
        icon: <FiLogIn className="text-blue-500" size={32} />,
        title: t('loginRequired'),
        message: action ?
        isRTL ?
        `لتتمكن من ${action}، يرجى تسجيل الدخول أولاً` :
        `To ${action}, please log in first` :
        t('loginRequired'),
        primaryButton: {
          text: t('logIn'),
          action: onLogin,
          variant: 'primary' as const
        },
        secondaryButton: {
          text: t('signUp'),
          action: onSignUp,
          variant: 'secondary' as const
        }
      };
    } else {
      return {
        icon: <FiUserPlus className="text-orange-500" size={32} />,
        title: t('accountNotRegistered'),
        message: t('accountNotRegistered'),
        primaryButton: {
          text: t('signUp'),
          action: onSignUp,
          variant: 'primary' as const
        },
        secondaryButton: {
          text: t('logIn'),
          action: onLogin,
          variant: 'secondary' as const
        }
      };
    }
  };

  const content = getModalContent();

  return (
    <AnimatePresence>
      {isOpen &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          onClick={onClose} />


          {/* Modal */}
          <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={clsx(
            "fixed inset-0 z-[9999] flex items-center justify-center p-4",
            isRTL ? "font-arabic" : "font-montserrat"
          )}
          dir={isRTL ? "rtl" : "ltr"}>

            <div
            className={clsx(
              "relative w-full max-w-md mx-auto",
              "bg-white/95 dark:bg-gray-900/95",
              "backdrop-blur-xl backdrop-saturate-200",
              "border border-gray-200/50 dark:border-gray-700/50",
              "rounded-2xl shadow-2xl",
              "overflow-hidden"
            )}
            style={{
              background: theme === 'dark' ?
              'rgba(17, 24, 39, 0.95)' :
              'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(25px) saturate(200%)',
              WebkitBackdropFilter: 'blur(25px) saturate(200%)',
              border: theme === 'dark' ?
              '1px solid rgba(75, 85, 99, 0.5)' :
              '1px solid rgba(209, 213, 219, 0.5)',
              boxShadow: theme === 'dark' ?
              '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(75, 85, 99, 0.3)' :
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(209, 213, 219, 0.3)'
            }}>

              {/* Close Button */}
              <button
              onClick={onClose}
              className={clsx(
                "absolute top-4 right-4 z-10",
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "transition-all duration-200",
                "hover:scale-110 active:scale-95",
                theme === 'dark' ?
                "text-gray-400 hover:text-white hover:bg-gray-700/50" :
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              )}
              aria-label={t('close')}>

                <FiX size={18} />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon */}
                <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", duration: 0.5 }}
                className="flex justify-center mb-6">

                  <div
                  className={clsx(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    "bg-blue-50 dark:bg-blue-900/20",
                    "border-2 border-blue-200 dark:border-blue-800"
                  )}>

                    {content.icon}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={clsx(
                  "text-xl font-bold mb-4",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>

                  {content.title}
                </motion.h2>

                {/* Message */}
                <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={clsx(
                  "text-sm leading-relaxed mb-8",
                  theme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>

                  {content.message}
                </motion.p>

                {/* Buttons */}
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={clsx(
                  "flex gap-3",
                  isRTL ? "flex-row-reverse" : "flex-row"
                )}>

                  <GlassButton
                  onClick={content.primaryButton.action}
                  variant={content.primaryButton.variant}
                  className="flex-1"
                  size="md">

                    {content.primaryButton.text}
                  </GlassButton>
                  
                  <GlassButton
                  onClick={content.secondaryButton.action}
                  variant={content.secondaryButton.variant}
                  className="flex-1"
                  size="md">

                    {content.secondaryButton.text}
                  </GlassButton>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div
              className={clsx(
                "absolute -top-1 -left-1 w-20 h-20 rounded-full opacity-20",
                "bg-gradient-to-br from-blue-400 to-purple-500",
                "blur-xl"
              )} />

              <div
              className={clsx(
                "absolute -bottom-1 -right-1 w-16 h-16 rounded-full opacity-20",
                "bg-gradient-to-br from-orange-400 to-pink-500",
                "blur-xl"
              )} />

            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}