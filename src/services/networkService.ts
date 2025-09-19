/**
 * Network Service - Handles connectivity and fallback logic
 */

import { API_CONFIG } from '../config/api';

interface NetworkStatus {
  isOnline: boolean;
  apiAvailable: boolean;
  lastCheck: number;
}

class NetworkService {
  private status: NetworkStatus = {
    isOnline: navigator.onLine,
    apiAvailable: false,
    lastCheck: 0
  };

  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private checkInterval?: number;

  constructor() {
    this.initializeEventListeners();
    this.startPeriodicCheck();
  }

  private initializeEventListeners() {
    // Browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    console.log('📶 Network connection restored');
    this.status.isOnline = true;
    this.checkApiAvailability();
  }

  private handleOffline() {
    console.log('📵 Network connection lost');
    this.status.isOnline = false;
    this.status.apiAvailable = false;
    this.notifyListeners();
  }

  private async checkApiAvailability(): Promise<boolean> {
    // Don't check too frequently
    const now = Date.now();
    if (now - this.status.lastCheck < 5000) {
      return this.status.apiAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Try to reach a simple endpoint
      const response = await fetch(API_CONFIG.BASE_URL + '/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      this.status.apiAvailable = response.ok;
      this.status.lastCheck = now;

      if (!this.status.apiAvailable) {
        console.log('⚠️ API server not responding, using offline mode');
      } else {
        console.log('✅ API server is available');
      }

    } catch (error) {
      console.log('⚠️ API check failed, using offline mode:', error instanceof Error ? error.message : 'Unknown error');
      this.status.apiAvailable = false;
      this.status.lastCheck = now;
    }

    this.notifyListeners();
    return this.status.apiAvailable;
  }

  private startPeriodicCheck() {
    // Check API availability periodically
    this.checkInterval = window.setInterval(() => {
      if (this.status.isOnline) {
        this.checkApiAvailability();
      }
    }, 30000); // Check every 30 seconds
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Public methods
  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  public async isApiAvailable(): Promise<boolean> {
    if (!this.status.isOnline) {
      return false;
    }
    return this.checkApiAvailability();
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkService = new NetworkService();

// Export hook for React components
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState(networkService.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

import React from 'react';