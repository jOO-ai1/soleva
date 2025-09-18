/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="react/jsx-runtime" />
/// <reference types="vite/client" />

// Global type declarations for the project
declare global {
  namespace React {
    interface ErrorBoundaryState {
      hasError: boolean;
      error?: Error;
    }
    
    interface ErrorBoundaryProps {
      children: React.ReactNode;
      fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
    }
  }

  // Environment variables for Vite
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_URL: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_FACEBOOK_APP_ID: string;
    readonly VITE_GTM_CONTAINER_ID: string;
    readonly VITE_FACEBOOK_PIXEL_ID: string;
    // Add more environment variables as needed
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // Process object for development environment checks
  declare const process: {
    env: {
      NODE_ENV: string;
    };
  };
}

// Ensure this file is treated as a module
export {};
