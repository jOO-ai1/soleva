import React from 'react';
import { useEffect } from 'react';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { initializeDatabase, createSampleData } from './utils/initializeDatabase';
import RoutesWrapper from "./components/RoutesWrapper";
import { AppErrorBoundary } from './components/AppErrorBoundary';
import ComprehensiveErrorBoundary from './components/ComprehensiveErrorBoundary';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import { NetworkErrorHandler } from './components/NetworkErrorHandler';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import SafeContextProvider from './components/SafeContextProvider';
import AppLoader from './components/AppLoader';
import { setDocumentTitle } from './utils/documentTitle';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'sonner';
import { environmentHandler } from './services/environmentHandler';

export default function App() {
  // Set the base document title on app initialization
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('App component mounted');
    }
    setDocumentTitle();
  }, []);

  // Initialize environment and database with comprehensive error handling
  useEffect(() => {
    const setupApplication = async () => {
      try {
        console.log('🚀 Initializing Soleva application with enhanced error handling...');

        // Log environment information
        const envInfo = environmentHandler.getEnvironmentInfo();
        console.log('🔍 Environment detected:', envInfo);

        // Check if we're in recovery mode
        if (environmentHandler.isRecoveryMode()) {
          console.log('🛡️ Running in recovery mode with fallback data');
          return;
        }

        const isInitialized = await initializeDatabase();

        if (isInitialized) {
          console.log('✅ Database initialized successfully');
          // Try to create sample data if it doesn't exist
          try {
            await createSampleData();
            console.log('✅ Sample data created/verified');
          } catch (sampleDataError) {
            console.warn('⚠️ Sample data creation failed, continuing with empty database:', sampleDataError);
          }
        } else {
          console.warn('⚠️ Database initialization incomplete, using fallback mode');
        }

        console.log('✅ Soleva application ready');
      } catch (error) {
        console.warn('⚠️ Database setup warning, app will continue in offline mode:', error);
        // The app should still work with mock data fallbacks
      }
    };

    setupApplication();
  }, []);

  return (
    <AppErrorBoundary>
      <ComprehensiveErrorBoundary>
        <EnhancedErrorBoundary context="App" showDetails={import.meta.env.DEV}>
          <SafeContextProvider>
          <AppLoader>
            <LangProvider>
              <ThemeProvider>
                <FavoritesProvider>
                  <AuthProvider>
                    <CartProvider>
                      <ToastProvider>
                        <NotificationProvider>
                          <GlobalErrorHandler />
                          <NetworkErrorHandler />
                          <RoutesWrapper />
                          <OfflineIndicator />
                          <Toaster
                              position="top-right"
                              closeButton
                              richColors
                              expand
                              duration={4000}
                              visibleToasts={5} />

                        </NotificationProvider>
                      </ToastProvider>
                    </CartProvider>
                  </AuthProvider>
                </FavoritesProvider>
              </ThemeProvider>
            </LangProvider>
          </AppLoader>
          </SafeContextProvider>
        </EnhancedErrorBoundary>
      </ComprehensiveErrorBoundary>
    </AppErrorBoundary>);

}