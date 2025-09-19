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

  // Initialize database on app startup
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const isInitialized = await initializeDatabase();
        if (isInitialized) {
          // Try to create sample data if it doesn't exist
          await createSampleData();
        }
      } catch (error) {
        console.warn('Database setup warning:', error);
        // Continue anyway - the app should still work with empty data
      }
    };

    setupDatabase();
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
        </AppErrorBoundary>);


  } catch (error) {
    // Log error in development, use proper error reporting in production
    if (process.env.NODE_ENV === 'development') {
      console.error('App initialization error:', error);
    }
    throw error;
  }
}