/**
 * Advanced Network Service with Error Handling and Recovery
 */

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface NetworkError extends Error {
  type: 'timeout' | 'offline' | 'server' | 'client' | 'unknown';
  status?: number;
  retryAfter?: number;
  recoverable: boolean;
}

class NetworkService {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus;
  private retryQueue: Map<string, () => Promise<any>> = new Map();

  constructor() {
    this.currentStatus = this.getInitialStatus();
    this.setupEventListeners();
    this.startConnectionMonitoring();
  }

  private getInitialStatus(): NetworkStatus {
    const connection = this.getConnection();
    
    return {
      isOnline: navigator.onLine,
      isSlowConnection: this.isSlowConnection(connection),
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  private getConnection(): any {
    return (navigator as any).connection || 
           (navigator as any).mozConnection || 
           (navigator as any).webkitConnection;
  }

  private isSlowConnection(connection: any): boolean {
    if (!connection) return false;
    
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' || 
           connection.downlink < 1;
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    const connection = this.getConnection();
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange);
    }
  }

  private handleOnline = () => {
    console.info('🌐 Connection restored');
    this.updateStatus({ isOnline: true });
    this.processRetryQueue();
  };

  private handleOffline = () => {
    console.warn('📡 Connection lost - entering offline mode');
    this.updateStatus({ isOnline: false });
  };

  private handleConnectionChange = () => {
    const connection = this.getConnection();
    const newStatus = {
      isSlowConnection: this.isSlowConnection(connection),
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
    
    console.info('📶 Connection quality changed:', newStatus);
    this.updateStatus(newStatus);
  };

  private updateStatus(update: Partial<NetworkStatus>) {
    this.currentStatus = { ...this.currentStatus, ...update };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  private startConnectionMonitoring() {
    // Periodically check connection quality
    setInterval(() => {
      this.checkConnectionQuality();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnectionQuality() {
    if (!navigator.onLine) return;

    try {
      const start = performance.now();
      
      // Use a small image to test connection
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const end = performance.now();
      const responseTime = end - start;
      
      const isSlowConnection = responseTime > 2000 || !response.ok;
      
      if (isSlowConnection !== this.currentStatus.isSlowConnection) {
        this.updateStatus({ isSlowConnection });
      }
    } catch (error) {
      console.warn('Connection quality check failed:', error);
      this.updateStatus({ isSlowConnection: true });
    }
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  public isSlowConnectionActive(): boolean {
    return this.currentStatus.isSlowConnection;
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current status
    listener(this.currentStatus);
    
    return () => this.listeners.delete(listener);
  }

  public addToRetryQueue(key: string, operation: () => Promise<any>) {
    console.info(`📝 Adding operation to retry queue: ${key}`);
    this.retryQueue.set(key, operation);
  }

  public removeFromRetryQueue(key: string) {
    this.retryQueue.delete(key);
  }

  private async processRetryQueue() {
    console.info(`🔄 Processing retry queue (${this.retryQueue.size} operations)`);
    
    const promises = Array.from(this.retryQueue.entries()).map(async ([key, operation]) => {
      try {
        await operation();
        this.retryQueue.delete(key);
        console.info(`✅ Retry operation succeeded: ${key}`);
      } catch (error) {
        console.warn(`❌ Retry operation failed: ${key}`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  public async withNetworkFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T | Promise<T>,
    options?: {
      timeout?: number;
      retryKey?: string;
    }
  ): Promise<T> {
    const timeout = options?.timeout || 10000;
    
    if (!this.isOnline()) {
      console.info('📴 Offline mode - using fallback');
      return await fallback();
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), timeout);
      });

      // Race between operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      console.warn('Network operation failed, using fallback:', error);
      
      // Add to retry queue if key provided
      if (options?.retryKey) {
        this.addToRetryQueue(options.retryKey, operation);
      }
      
      return await fallback();
    }
  }

  public createNetworkError(
    message: string, 
    type: NetworkError['type'] = 'unknown',
    options?: {
      status?: number;
      retryAfter?: number;
      cause?: Error;
    }
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.type = type;
    error.status = options?.status;
    error.retryAfter = options?.retryAfter;
    error.recoverable = type !== 'client' && type !== 'unknown';
    error.cause = options?.cause;
    
    return error;
  }

  public destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    const connection = this.getConnection();
    if (connection) {
      connection.removeEventListener('change', this.handleConnectionChange);
    }
    
    this.listeners.clear();
    this.retryQueue.clear();
  }
}

// Singleton instance
export const networkService = new NetworkService();

// Utility functions
export const isNetworkError = (error: any): error is NetworkError => {
  return error && typeof error.type === 'string' && 'recoverable' in error;
};

export const getNetworkErrorMessage = (error: NetworkError): string => {
  switch (error.type) {
    case 'offline':
      return 'You appear to be offline. Please check your internet connection.';
    case 'timeout':
      return 'The request timed out. Please try again.';
    case 'server':
      return 'Server error occurred. Please try again later.';
    case 'client':
      return 'There was a problem with your request. Please check and try again.';
    default:
      return 'A network error occurred. Please try again.';
  }
};

// React hook for network status
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState(networkService.getStatus());
  
  React.useEffect(() => {
    return networkService.subscribe(setStatus);
  }, []);
  
  return status;
};

// Export for React import
if (typeof React !== 'undefined') {
  const React = require('react');
}
