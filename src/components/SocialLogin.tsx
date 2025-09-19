import * as React from 'react';

// Import React hooks
const { useState } = React;
import { motion } from 'framer-motion';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

interface SocialLoginProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
  onRevokeSuccess?: () => void;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ mode, onSuccess, onRevokeSuccess }: SocialLoginProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const auth = useAuth();
  const socialLogin = auth?.socialLogin;
  const { lang } = useLang();

  const handleGoogleLogin = async () => {
    try {
      setLoading('google');

      // Check if Google Client ID is configured
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        return;
      }

      // Load Google Identity Services
      if (!window.google) {
        await loadGoogleScript();
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Prompt for sign-in
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to popup if prompt is not displayed
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%'
            }
          );
          document.getElementById('google-signin-button')?.click();
        }
      });
    } catch (error) {
      // Log error in development, use proper error reporting in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Google login error:', error);
      }
      setLoading(null);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      if (!response?.credential) {
        throw new Error('No credential received from Google');
      }

      if (!socialLogin) {
        return;
      }

      const result = await socialLogin('google', { credential: response.credential });
      if (result.success) {
        onSuccess?.();
      }
    } catch (error: any) {
      // Log error in development, use proper error reporting in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Google callback error:', error);
      }
      // Error handling is now done by the AuthContext with notification banners
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      // Check if Facebook login is enabled
      const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
      if (!facebookAppId || facebookAppId.trim() === '') {
        return;
      }

      setLoading('facebook');

      // Load Facebook SDK
      if (!window.FB) {
        await loadFacebookScript();
      }

      // Initialize Facebook SDK
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });

      // Login with Facebook
      window.FB.login(async (response: any) => {
        if (response.authResponse) {
          try {
            // Get user profile
            window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo: any) => {
              if (!socialLogin) {
                return;
              }

              const result = await socialLogin('facebook', {
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID,
                profile: userInfo
              });

              if (result.success) {
                onSuccess?.();
              }
            });
          } catch (error) {
            // Log error in development, use proper error reporting in production
            if (process.env.NODE_ENV === 'development') {
              console.error('Facebook profile fetch error:', error);
            }
            // Error handling is now done by the AuthContext with notification banners
          }
        }
        setLoading(null);
      }, { scope: 'email,public_profile' });
    } catch (error) {
      // Log error in development, use proper error reporting in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Facebook login error:', error);
      }
      // Error handling is now done by the AuthContext with notification banners
      setLoading(null);
    }
  };

  // Google consent revocation function
  const revokeGoogleConsent = async (email: string): Promise<void> => {
    try {
      // Check if Google Client ID is configured
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error('Google Client ID not configured');
      }

      // Load Google Identity Services if not already loaded
      if (!window.google) {
        await loadGoogleScript();
      }

      // Revoke Google consent
      window.google.accounts.id.revoke(email, (done: any) => {
        // Log in development only
        if (process.env.NODE_ENV === 'development') {
          console.log('Google consent revoked for:', email);
        }
        onRevokeSuccess?.();
      });
    } catch (error) {
      // Log error in development, use proper error reporting in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Google consent revocation error:', error);
      }
      // Error handling is now done by the AuthContext with notification banners
    }
  };

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  };

  const loadFacebookScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Facebook script'));
      document.head.appendChild(script);
    });
  };

  return (
    <div className="social-login">
      <div className="social-divider">
        <div className="divider-line"></div>
        <span className="divider-text">
          {mode === 'login' ?
          lang === 'ar' ? 'أو سجل الدخول باستخدام' : 'or sign in with' :
          lang === 'ar' ? 'أو أنشئ حساب باستخدام' : 'or sign up with'
          }
        </span>
        <div className="divider-line"></div>
      </div>

      <div className="social-buttons">
        <motion.button
          type="button"
          className={`social-button google ${loading === 'google' ? 'loading' : ''}`}
          onClick={handleGoogleLogin}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>

          <div className="social-button-content">
            {loading === 'google' ?
            <div className="loading-spinner"></div> :

            <FaGoogle />
            }
            <span className="social-text">
              {loading === 'google' ?
              lang === 'ar' ? 'جاري التحميل...' : 'Loading...' :
              lang === 'ar' ? 'جوجل' : 'Google'
              }
            </span>
          </div>
        </motion.button>

        {/* Facebook Login Button - Only show if enabled */}
        {import.meta.env.VITE_FACEBOOK_APP_ID && import.meta.env.VITE_FACEBOOK_APP_ID.trim() !== '' &&
        <motion.button
          type="button"
          className={`social-button facebook ${loading === 'facebook' ? 'loading' : ''}`}
          onClick={handleFacebookLogin}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>

            <div className="social-button-content">
              {loading === 'facebook' ?
            <div className="loading-spinner"></div> :

            <FaFacebook />
            }
              <span className="social-text">
                {loading === 'facebook' ?
              lang === 'ar' ? 'جاري التحميل...' : 'Loading...' :
              lang === 'ar' ? 'فيسبوك' : 'Facebook'
              }
              </span>
            </div>
          </motion.button>
        }
      </div>

      {/* Hidden Google Sign-In button for fallback */}
      <div id="google-signin-button" style={{ display: 'none' }}></div>

      <style>{`
        .social-login {
          margin-top: 1.5rem;
        }

        .social-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border-primary);
        }

        .divider-text {
          padding: 0 1rem;
          font-size: 0.875rem;
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .social-buttons {
            flex-direction: row;
            gap: 1rem;
          }
        }

        .social-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--glass-bg);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          color: var(--text-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 48px;
        }

        .social-button:hover:not(:disabled) {
          border-color: var(--primary-200);
          background: var(--primary-50);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .social-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .social-button.google:hover:not(:disabled) {
          border-color: #4285f4;
          background: rgba(66, 133, 244, 0.1);
        }

        .social-button.facebook:hover:not(:disabled) {
          border-color: #1877f2;
          background: rgba(24, 119, 242, 0.1);
        }

        .social-button-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .social-icon {
          font-size: 1.25rem;
        }

        .social-button.google .social-icon {
          color: #4285f4;
        }

        .social-button.facebook .social-icon {
          color: #1877f2;
        }

        .social-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .loading-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        [data-theme="dark"] .social-button {
          background: rgba(10, 10, 10, 0.9);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .social-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>);

};

// Extend window interface for Google and Facebook
declare global {
  interface Window {
    google: any;
    FB: any;
  }
}


export default SocialLogin;