import * as React from 'react';

// Import React hooks
const { createContext, useContext, useEffect, useState } = React;
import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/storage';
import { authApi } from '../services/api';
import { API_CONFIG } from '../config/api';
import { revokeGoogleConsent, isGoogleConsentRevocationAvailable } from '../utils/googleConsent';
import { useNotification } from './NotificationContext';
import { useLang } from './LangContext';
import { translations } from '../constants/translations';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  preferredLanguage: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    message?: string;
    errorType?: 'invalid_credentials' | 'account_not_found' | 'account_disabled' | 'email_not_verified' | 'account_locked' | 'rate_limited' | 'captcha_required' | 'network_error';
    retryAfter?: number;
  }>;
  register: (userData: {name: string;email: string;phoneNumber: string;password: string;password_confirmation: string;}) => Promise<{
    success: boolean;
    message?: string;
    errorType?: 'email_exists' | 'password_weak' | 'invalid_email' | 'rate_limited' | 'captcha_required' | 'network_error' | 'validation_error';
    errors?: any;
    requiresVerification?: boolean;
  }>;
  socialLogin: (provider: 'google' | 'facebook', data: Record<string, unknown>) => Promise<{
    success: boolean;
    message?: string;
    errorType?: 'account_not_found' | 'account_disabled' | 'rate_limited' | 'network_error' | 'invalid_token' | 'provider_error';
    error?: string;
  }>;
  forgotPassword: (email: string, phoneNumber: string) => Promise<{success: boolean;message?: string;}>;
  resetPassword: (token: string, newPassword: string) => Promise<{success: boolean;message?: string;}>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();
  const { lang } = useLang();
  const t = translations[lang as keyof typeof translations];

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = safeGetItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            setUser(response.data as User);
            setIsAuthenticated(true);
          } else {
            safeRemoveItem('auth_token');
            safeRemoveItem('user');
          }
        } catch (error) {
          safeRemoveItem('auth_token');
          safeRemoveItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success) {
        // Store token and user data
        const responseData = response.data as {token: string;refreshToken?: string;user: User;};
        safeSetItem('auth_token', responseData.token);
        if (responseData.refreshToken) {
          safeSetItem('refresh_token', responseData.refreshToken);
        }
        safeSetItem('user', JSON.stringify(responseData.user));

        setUser(responseData.user);
        setIsAuthenticated(true);

        // Show success notification
        showSuccess(
          lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
          t.loginSuccessBanner
        );

        return { success: true };
      } else {
        // Enhanced error handling with detailed error types
        let errorType: 'invalid_credentials' | 'account_not_found' | 'account_disabled' | 'email_not_verified' | 'account_locked' | 'rate_limited' | 'captcha_required' | 'network_error' = 'invalid_credentials';

        // Check message content for error type determination
        const message = response.message || '';
        if (message.includes('EMAIL_NOT_VERIFIED') || message.includes('email verification')) {
          errorType = 'email_not_verified';
        } else if (message.includes('ACCOUNT_DISABLED') || message.includes('disabled')) {
          errorType = 'account_disabled';
        } else if (message.includes('ACCOUNT_LOCKED') || message.includes('locked')) {
          errorType = 'account_locked';
        } else if (message.includes('RATE_LIMIT_EXCEEDED') || message.includes('too many')) {
          errorType = 'rate_limited';
        } else if (message.includes('CAPTCHA_REQUIRED') || message.includes('CAPTCHA_FAILED')) {
          errorType = 'captcha_required';
        } else if (message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('does not exist')) {
          errorType = 'account_not_found';
        } else if (message.toLowerCase().includes('disabled') ||
        message.toLowerCase().includes('inactive')) {
          errorType = 'account_disabled';
        }

        // Show error notification
        const errorMessages: Record<string, string> = {
          'email_not_verified': t.emailNotVerified,
          'account_disabled': t.accountDisabled,
          'account_locked': t.accountLocked,
          'account_not_found': t.accountNotFound,
          'rate_limited': t.tooManyAttempts,
          'captcha_required': t.captchaRequired,
          'network_error': t.networkError
        };

        showError(
          lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
          errorMessages[errorType] || t.invalidPassword
        );

        return {
          success: false,
          message: message || 'Login failed',
          errorType,
          retryAfter: (response as any).retryAfter
        };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);

      // Handle different types of errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        if (apiError.status === 429) {
          showError(
            lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
            t.tooManyAttempts
          );
          return {
            success: false,
            message: 'Too many login attempts. Please try again later.',
            errorType: 'rate_limited' as const,
            retryAfter: apiError.retryAfter
          };
        } else if (apiError.status === 0) {
          showError(
            lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
            t.networkError
          );
          return {
            success: false,
            message: 'Unable to connect to server. Please check your internet connection.',
            errorType: 'network_error' as const
          };
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      showError(
        lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
        t.invalidPassword
      );
      return {
        success: false,
        message: errorMessage,
        errorType: 'invalid_credentials' as const
      };
    }
  };

  const register = async (userData: {name: string;email: string;phoneNumber: string;password: string;password_confirmation: string;}) => {
    try {
      const response = await authApi.register(userData);

      if (response.success) {
        // Check if email verification is required
        const responseData = response.data as any;
        if (responseData?.requiresVerification) {
          showSuccess(
            lang === 'ar' ? 'تم التسجيل بنجاح' : 'Registration Successful',
            lang === 'ar' ? 'يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك' : 'Please check your email to verify your account'
          );
          return {
            success: true,
            requiresVerification: true,
            message: response.message || 'Please check your email to verify your account'
          };
        }

        // Store token and user data (if no verification required)
        if (responseData?.token) {
          safeSetItem('auth_token', responseData.token);
          safeSetItem('user', JSON.stringify(responseData.user));

          setUser(responseData.user);
          setIsAuthenticated(true);
        }

        showSuccess(
          lang === 'ar' ? 'تم التسجيل بنجاح' : 'Registration Successful',
          t.registrationSuccess
        );

        return { success: true };
      } else {
        // Enhanced error handling for registration
        let errorType: 'email_exists' | 'password_weak' | 'invalid_email' | 'rate_limited' | 'captcha_required' | 'network_error' | 'validation_error' = 'validation_error';

        const message = response.message || '';
        if (message.includes('EMAIL_ALREADY_EXISTS') || message.includes('already exists')) {
          errorType = 'email_exists';
        } else if (message.includes('PASSWORD_TOO_WEAK') || message.includes('password too weak')) {
          errorType = 'password_weak';
        } else if (message.includes('INVALID_EMAIL') || message.includes('invalid email')) {
          errorType = 'invalid_email';
        } else if (message.includes('RATE_LIMIT_EXCEEDED') || message.includes('too many')) {
          errorType = 'rate_limited';
        } else if (message.includes('CAPTCHA_REQUIRED') || message.includes('CAPTCHA_FAILED')) {
          errorType = 'captcha_required';
        }

        // Show error notification
        showError(
          lang === 'ar' ? 'فشل التسجيل' : 'Registration Failed',
          t.registrationFailed
        );

        return {
          success: false,
          message: message || 'Registration failed',
          errorType,
          errors: (response as any).errors
        };
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);

      // Handle different types of errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        if (apiError.status === 429) {
          return {
            success: false,
            message: 'Too many registration attempts. Please try again later.',
            errorType: 'rate_limited' as const
          };
        } else if (apiError.status === 0) {
          return {
            success: false,
            message: 'Unable to connect to server. Please check your internet connection.',
            errorType: 'network_error' as const
          };
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      return {
        success: false,
        message: errorMessage,
        errorType: 'validation_error' as const
      };
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook', data: Record<string, unknown>) => {
    try {
      const endpoint = provider === 'google' ? '/customer/google' : '/customer/facebook';
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Store token and user data
        safeSetItem('auth_token', result.token);
        safeSetItem('user', JSON.stringify(result.user));

        setUser(result.user);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        // Enhanced error handling for social login
        let errorType: 'account_not_found' | 'account_disabled' | 'rate_limited' | 'network_error' | 'invalid_token' | 'provider_error' = 'provider_error';

        const message = result.message || '';
        if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('does not exist')) {
          errorType = 'account_not_found';
        } else if (message.includes('ACCOUNT_DISABLED') || message.includes('disabled')) {
          errorType = 'account_disabled';
        } else if (message.includes('RATE_LIMIT_EXCEEDED') || message.includes('too many')) {
          errorType = 'rate_limited';
        } else if (message.includes('INVALID_TOKEN') || message.includes('invalid token')) {
          errorType = 'invalid_token';
        }

        return {
          success: false,
          message: message || `${provider} login failed`,
          errorType,
          error: result.error
        };
      }
    } catch (error: unknown) {
      console.error(`${provider} login error:`, error);

      // Handle different types of errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        if (apiError.status === 429) {
          return {
            success: false,
            message: 'Too many login attempts. Please try again later.',
            errorType: 'rate_limited' as const
          };
        } else if (apiError.status === 0) {
          return {
            success: false,
            message: 'Unable to connect to server. Please check your internet connection.',
            errorType: 'network_error' as const
          };
        }
      }

      const errorMessage = error instanceof Error ? error.message : `${provider} login failed. Please try again.`;
      return {
        success: false,
        message: errorMessage,
        errorType: 'network_error' as const
      };
    }
  };

  const logout = async () => {
    try {
      // Revoke Google consent if user has Google account and revocation is available
      if (user?.email && isGoogleConsentRevocationAvailable()) {
        try {
          await revokeGoogleConsent(
            user.email,
            () => console.log('Google consent revoked successfully'),
            (error) => console.warn('Failed to revoke Google consent:', error)
          );
        } catch (error) {
          // Continue with logout even if Google consent revocation fails
          console.warn('Google consent revocation failed:', error);
        }
      }

      // Call backend logout
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Backend logout failed:', error);
    } finally {
      // Clear local storage and state
      safeRemoveItem('auth_token');
      safeRemoveItem('user');
      safeRemoveItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);

      // Show logout success notification
      showSuccess(
        lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logout Successful',
        t.logoutSuccess
      );
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data as User);
        safeSetItem('user', JSON.stringify(response.data));
      }
    } catch (error) {










      // Failed to refresh user data  
      console.warn('Failed to refresh user data:', error);
    }
  };
  const forgotPassword = async (email: string, phoneNumber: string) => {
    try {
      const response = await authApi.forgotPassword({ email, phoneNumber });
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to request password reset'
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await authApi.resetPassword({ token, newPassword });
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reset password'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      register,
      socialLogin,
      forgotPassword,
      resetPassword,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>);

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Safe version of useAuth that doesn't throw during loading
export function useAuthSafe() {
  const context = useContext(AuthContext);
  return context;
}