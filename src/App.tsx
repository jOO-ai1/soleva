import { useEffect } from 'react';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RoutesWrapper from "./components/RoutesWrapper";
import AppErrorBoundary from './components/AppErrorBoundary';
import AppLoader from './components/AppLoader';
import { setDocumentTitle } from './utils/documentTitle';

export default function App() {
  // Set the base document title on app initialization
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('App component mounted');
    }
    setDocumentTitle();
  }, []);

  try {
    return (
      <AppErrorBoundary>
          <AppLoader>
            <LangProvider>
              <ThemeProvider>
                <FavoritesProvider>
                  <AuthProvider>
                    <CartProvider>
                      <ToastProvider>
                        <NotificationProvider>
                          <RoutesWrapper />
                        </NotificationProvider>
                      </ToastProvider>
                    </CartProvider>
                  </AuthProvider>
                </FavoritesProvider>
              </ThemeProvider>
            </LangProvider>
          </AppLoader>
        </AppErrorBoundary>
    );
  } catch (error) {
    // Log error in development, use proper error reporting in production
    if (process.env.NODE_ENV === 'development') {
      console.error('App initialization error:', error);
    }
    throw error;
  }
}