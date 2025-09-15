import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferredLanguage: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; errorType?: 'invalid_credentials' | 'account_not_found' | 'account_disabled' }>;
  register: (userData: { name: string; email: string; password: string; password_confirmation: string }) => Promise<{ success: boolean; message?: string }>;
  socialLogin: (provider: 'google' | 'facebook', data: any) => Promise<{ success: boolean; message?: string; errorType?: 'account_not_found' }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            setUser(response.data as User);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
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
        localStorage.setItem('auth_token', (response.data as any).token);
        localStorage.setItem('user', JSON.stringify((response.data as any).user));
        
        setUser((response.data as any).user as User);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        // Determine error type based on response message
        let errorType: 'invalid_credentials' | 'account_not_found' | 'account_disabled' = 'invalid_credentials';
        
        if (response.message?.toLowerCase().includes('not found') || 
            response.message?.toLowerCase().includes('does not exist')) {
          errorType = 'account_not_found';
        } else if (response.message?.toLowerCase().includes('disabled') || 
                   response.message?.toLowerCase().includes('inactive')) {
          errorType = 'account_disabled';
        }
        
        return { 
          success: false, 
          message: response.message || 'Login failed',
          errorType
        };
      }
    } catch (error: any) {
        return { 
          success: false, 
          message: error.message || 'Login failed. Please try again.',
          errorType: 'invalid_credentials' as const
        };
    }
  };

  const register = async (userData: { name: string; email: string; password: string; password_confirmation: string }) => {
    try {
      const response = await authApi.register(userData);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('auth_token', (response.data as any).token);
        localStorage.setItem('user', JSON.stringify((response.data as any).user));
        
        setUser((response.data as any).user as User);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook', data: any) => {
    try {
      const endpoint = provider === 'google' ? '/customer/google' : '/customer/facebook';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/v1/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        // Store token and user data
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        // Check if account doesn't exist
        const errorType: 'account_not_found' | undefined = result.message?.toLowerCase().includes('not found') || 
                         result.message?.toLowerCase().includes('does not exist') 
                         ? 'account_not_found' : undefined;
        
        return { 
          success: false, 
          message: result.message || `${provider} login failed`,
          errorType
        };
      }
    } catch (error: any) {
        return { 
          success: false, 
          message: error.message || `${provider} login failed. Please try again.`,
          errorType: 'account_not_found' as const
        };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data as User);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      // Failed to refresh user data
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
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}