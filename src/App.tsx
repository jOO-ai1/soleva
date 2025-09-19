import React from 'react';
import { useEffect } from 'react';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RoutesWrapper from "./components/RoutesWrapper";
import { setDocumentTitle } from './utils/documentTitle';
import { Toaster } from 'sonner';
import apiService from './services/apiService';
import { mockDataService } from './services/mockDataService';

export default function App() {
  // Set the base document title on app initialization
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('App component mounted');
    }
    setDocumentTitle();
  }, []);

// Initialize application with network connectivity check
  useEffect(() => {
    const setupApplication = async () => {
      try {
        console.log('🚀 Initializing Soleva application...');

        // Check network connectivity
        const isConnected = await apiService.checkConnectivity();
        
        if (!isConnected) {
          console.log('🔄 Backend not available, enabling mock data mode');
          mockDataService.setOfflineMode(true);
          apiService.setFallbackEnabled(true);
        } else {
          console.log('✅ Backend connection established');
          mockDataService.setOfflineMode(false);
        }

        console.log('✅ Soleva application ready');
      } catch (error) {
        console.warn('⚠️ Application setup warning, continuing with fallback mode:', error);
        mockDataService.setOfflineMode(true);
        apiService.setFallbackEnabled(true);
      }
    };

    setupApplication();
  }, []);

  return (
    <LangProvider>
      <ThemeProvider>
        <ToastProvider>
          <FavoritesProvider>
            <AuthProvider>
              <CartProvider>
                <RoutesWrapper />
                <Toaster
                    position="top-right"
                    closeButton
                    richColors
                    expand
                    duration={4000}
                    visibleToasts={5} />
              </CartProvider>
            </AuthProvider>
          </FavoritesProvider>
        </ToastProvider>
      </ThemeProvider>
    </LangProvider>);
}