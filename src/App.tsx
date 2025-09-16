import { useEffect } from 'react';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import RoutesWrapper from "./components/RoutesWrapper";
import AppErrorBoundary from './components/AppErrorBoundary';
import AppLoader from './components/AppLoader';
import { setDocumentTitle } from './utils/documentTitle';

export default function App() {
  // Set the base document title on app initialization
  useEffect(() => {
    setDocumentTitle();
  }, []);

  return (
    <AppErrorBoundary>
      <AppLoader>
        <LangProvider>
          <ThemeProvider>
            <FavoritesProvider>
              <AuthProvider>
                <CartProvider>
                  <ToastProvider>
                    <RoutesWrapper />
                  </ToastProvider>
                </CartProvider>
              </AuthProvider>
            </FavoritesProvider>
          </ThemeProvider>
        </LangProvider>
      </AppLoader>
    </AppErrorBoundary>
  );
}
