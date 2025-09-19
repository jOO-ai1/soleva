/**
 * API Service with Fallback Support
 * Handles API calls with automatic fallback to mock data
 */

import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api';
import { mockDataService } from './mockDataService';
import { shouldUseMockData } from '../config/environment';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private fallbackEnabled: boolean = true;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Check if we should use fallback data
  private shouldUseFallback(): boolean {
    return this.fallbackEnabled && (shouldUseMockData() || mockDataService.isInOfflineMode());
  }

  // Generic fetch wrapper with error handling
  private async fetchWithFallback<T>(
    endpoint: string, 
    options: RequestInit = {},
    fallbackMethod?: () => Promise<T>
  ): Promise<T> {
    // If we're in fallback mode, use mock data immediately
    if (this.shouldUseFallback() && fallbackMethod) {
      console.log('🔄 Using mock data for:', endpoint);
      return fallbackMethod();
    }

    const url = buildApiUrl(endpoint);
    const config: RequestInit = {
      timeout: this.timeout,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      // Check if URL indicates offline mode
      if (url.startsWith('offline://') || url.startsWith('local://')) {
        if (fallbackMethod) {
          console.log('🔄 Using fallback data for offline URL:', url);
          return fallbackMethod();
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`⚠️ API request failed for ${endpoint}:`, error);

      // If we have a fallback method and fallback is enabled, use it
      if (fallbackMethod && this.fallbackEnabled) {
        console.log('🔄 Falling back to mock data for:', endpoint);
        
        // Enable offline mode in mock service
        if (!mockDataService.isInOfflineMode()) {
          mockDataService.setOfflineMode(true);
        }
        
        return fallbackMethod();
      }

      // Re-throw error if no fallback available
      throw error;
    }
  }

  // Products API
  async getProducts(filters?: any) {
    return this.fetchWithFallback(
      API_ENDPOINTS.PRODUCTS.LIST + (filters ? `?${new URLSearchParams(filters).toString()}` : ''),
      { method: 'GET' },
      () => mockDataService.getProducts(filters)
    );
  }

  async getProduct(id: number) {
    return this.fetchWithFallback(
      API_ENDPOINTS.PRODUCTS.SHOW(id),
      { method: 'GET' },
      () => mockDataService.getProduct(id)
    );
  }

  async searchProducts(query: string) {
    return this.fetchWithFallback(
      `${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
      () => mockDataService.searchProducts(query)
    );
  }

  // Categories API  
  async getCategories() {
    return this.fetchWithFallback(
      API_ENDPOINTS.CATEGORIES.LIST,
      { method: 'GET' },
      () => mockDataService.getCategories()
    );
  }

  // Collections API
  async getCollections() {
    return this.fetchWithFallback(
      API_ENDPOINTS.COLLECTIONS.LIST,
      { method: 'GET' },
      () => mockDataService.getCollections()
    );
  }

  // Chat availability (no fallback needed)
  async getChatAvailability(language: string = 'en') {
    try {
      const response = await this.fetchWithFallback(
        `/chat/availability?language=${language}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      // Return default availability if API fails
      return {
        success: true,
        data: {
          available: false,
          message: 'Chat temporarily unavailable'
        }
      };
    }
  }

  // Configuration API
  async getConfig() {
    try {
      return await this.fetchWithFallback(
        API_ENDPOINTS.CONFIG,
        { method: 'GET' }
      );
    } catch (error) {
      // Return default config if API fails
      return {
        success: true,
        data: {
          store: {
            name: { en: 'Soleva', ar: 'سوليفا' },
            currency: 'EGP'
          },
          features: {
            chatEnabled: false,
            wishlist: true
          }
        }
      };
    }
  }

  // Method to enable/disable fallback mode
  setFallbackEnabled(enabled: boolean) {
    this.fallbackEnabled = enabled;
    console.log(`🔄 API fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Method to check network connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl('/health'), {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
