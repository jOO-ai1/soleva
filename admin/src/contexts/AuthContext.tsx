import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  preferredLanguage: string;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{success: boolean;requiresTwoFactor?: boolean;message?: string;}>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
          }
        } catch {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      const response = await authAPI.login(email, password, twoFactorToken);

      if (response.success) {
        if (response.requiresTwoFactor) {
          return { success: true, requiresTwoFactor: true, message: response.message };
        }

        // Store token and user data
        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('admin_user', JSON.stringify(response.user));

        setUser(response.user);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error ?
      (error as {response?: {data?: {message?: string;};};}).response?.data?.message :
      'Login failed. Please try again.';
      return {
        success: false,
        message: errorMessage || 'Login failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {


















      // Continue with logout even if API call fails
    } finally {localStorage.removeItem('admin_token');localStorage.removeItem('admin_user');setUser(null);setIsAuthenticated(false);}};const refreshUser = async () => {try {const response = await authAPI.getProfile();if (response.success && response.data) {setUser(response.data);localStorage.setItem('admin_user', JSON.stringify(response.data));}} catch {















      // Failed to refresh user data
    }};return <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>;};