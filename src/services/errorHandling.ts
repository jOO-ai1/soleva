/**
 * Comprehensive Error Handling Service
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface LoggedError extends Error {
  context?: ErrorContext;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'network' | 'api' | 'ui' | 'auth' | 'system';
  recoverable?: boolean;
  fallbackExecuted?: boolean;
}

export interface ErrorRecoveryStrategy {
  retry?: () => Promise<void>;
  fallback?: () => void;
  userAction?: {
    label: string;
    action: () => void;
  };
}

class ErrorHandlingService {
  private errorQueue: LoggedError[] = [];
  private maxQueueSize = 50;
  private listeners: Set<(error: LoggedError) => void> = new Set();

  /**
   * Log an error with context and optional recovery strategies
   */
  logError(
    error: Error | string,
    context?: ErrorContext,
    severity: LoggedError['severity'] = 'medium'
  ): LoggedError {
    const loggedError: LoggedError = {
      ...(typeof error === 'string' ? new Error(error) : error),
      context: {
        timestamp: Date.now(),
        ...context,
      },
      severity,
      category: this.categorizeError(error),
      recoverable: this.isRecoverable(error),
    } as LoggedError;

    // Add to queue
    this.errorQueue.push(loggedError);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Console logging with categorized formatting
    this.consoleLog(loggedError);

    // Notify listeners
    this.notifyListeners(loggedError);

    // Send to monitoring service if available
    this.sendToMonitoring(loggedError);

    return loggedError;
  }

  /**
   * Handle network-specific errors
   */
  handleNetworkError(
    error: Error,
    context?: ErrorContext
  ): LoggedError & { recovery: ErrorRecoveryStrategy } {
    const loggedError = this.logError(error, context, 'high');
    
    const recovery: ErrorRecoveryStrategy = {
      retry: async () => {
        // Retry logic would be handled by the calling component
        console.log('🔄 Retrying network request...');
      },
      fallback: () => {
        console.log('📱 Using offline mode...');
      },
      userAction: {
        label: 'Retry Connection',
        action: () => {
          window.location.reload();
        }
      }
    };

    return { ...loggedError, recovery };
  }

  /**
   * Handle API-specific errors
   */
  handleApiError(
    error: any,
    endpoint: string,
    context?: ErrorContext
  ): LoggedError & { recovery: ErrorRecoveryStrategy } {
    const errorMessage = error.message || error.toString();
    const loggedError = this.logError(
      new Error(`API Error: ${errorMessage} (${endpoint})`),
      { ...context, endpoint },
      error.status >= 500 ? 'high' : 'medium'
    );

    const recovery: ErrorRecoveryStrategy = {
      retry: async () => {
        console.log(`🔄 Retrying API call to ${endpoint}...`);
      },
      fallback: () => {
        console.log('📦 Using cached/mock data...');
      }
    };

    // Add status-specific handling
    if (error.status === 401) {
      recovery.userAction = {
        label: 'Login Again',
        action: () => {
          window.location.href = '/login';
        }
      };
    } else if (error.status >= 500) {
      recovery.userAction = {
        label: 'Report Issue',
        action: () => {
          // Open support chat or redirect to contact
          console.log('Opening support...');
        }
      };
    }

    return { ...loggedError, recovery };
  }

  /**
   * Handle React component errors
   */
  handleComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    context?: ErrorContext
  ): LoggedError {
    return this.logError(error, {
      ...context,
      componentStack: errorInfo.componentStack,
      component: context?.component || 'Unknown'
    }, 'high');
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): LoggedError[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: LoggedError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  private categorizeError(error: Error | string): LoggedError['category'] {
    const message = typeof error === 'string' ? error : error.message;
    
    if (message.includes('fetch') || message.includes('network') || message.includes('ERR_CONNECTION')) {
      return 'network';
    }
    if (message.includes('API') || message.includes('request failed')) {
      return 'api';
    }
    if (message.includes('auth') || message.includes('token') || message.includes('login')) {
      return 'auth';
    }
    if (message.includes('component') || message.includes('render')) {
      return 'ui';
    }
    return 'system';
  }

  private isRecoverable(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    
    // Network errors are usually recoverable with retry
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return true;
    }
    
    // API errors might be recoverable depending on status
    if (message.includes('API') && !message.includes('404')) {
      return true;
    }
    
    return false;
  }

  private consoleLog(error: LoggedError): void {
    const emoji = this.getSeverityEmoji(error.severity);
    const category = error.category?.toUpperCase() || 'ERROR';
    
    const style = this.getSeverityStyle(error.severity);
    
    console.group(`${emoji} ${category} Error`);
    console.error(`%c${error.message}`, style);
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  private getSeverityEmoji(severity?: LoggedError['severity']): string {
    switch (severity) {
      case 'low': return '⚠️';
      case 'medium': return '🔶';
      case 'high': return '❌';
      case 'critical': return '🚨';
      default: return '⚠️';
    }
  }

  private getSeverityStyle(severity?: LoggedError['severity']): string {
    switch (severity) {
      case 'low': return 'color: orange; font-weight: normal;';
      case 'medium': return 'color: darkorange; font-weight: bold;';
      case 'high': return 'color: red; font-weight: bold;';
      case 'critical': return 'color: darkred; font-weight: bold; font-size: 14px;';
      default: return 'color: orange; font-weight: normal;';
    }
  }

  private notifyListeners(error: LoggedError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  private sendToMonitoring(error: LoggedError): void {
    // In a real app, this would send to Sentry, LogRocket, etc.
    if (import.meta.env.PROD && error.severity === 'critical') {
      console.log('Would send to monitoring service:', error);
    }
  }
}

export const errorHandler = new ErrorHandlingService();

// Global error handler
window.addEventListener('error', (event) => {
  errorHandler.logError(event.error || new Error(event.message), {
    component: 'Global',
    action: 'unhandled_error',
    metadata: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  }, 'high');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorHandler.logError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    },
    'high'
  );
});
