// API Configuration for Backend Integration
export const API_CONFIG = {
  // Base URL - prefer VITE_API_URL (common), fallback to environment detection
  BASE_URL: import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (() => {
    // Always use environment variables or default to localhost in development
    if (import.meta.env.DEV) {
      return 'http://localhost:3001/api/v1';
    }
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Production domains
      if (hostname === 'solevaeg.com' || hostname === 'www.solevaeg.com') {
        return 'https://api.solevaeg.com/api/v1';
      }
      // EasySite deployment
      if (hostname.includes('easysite.ai')) {
        // Use relative API for EasySite deployments to avoid CORS
        return '/api/v1';
      }
      // Development and localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
        return 'http://localhost:3001/api/v1';
      }
    }
    // Default fallback - use relative path to avoid connection issues
    return '/api/v1';
  })(),

  // API Version
  VERSION: 'v1',

  // Timeout settings
  TIMEOUT: 30000,

  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },

  // Authentication
  AUTH_TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/customer/login',
    REGISTER: '/auth/customer/register',
    LOGOUT: '/auth/customer/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/customer/profile',
    GOOGLE: '/auth/customer/google',
    FACEBOOK: '/auth/customer/facebook',
    DISCONNECT_GOOGLE: '/auth/customer/disconnect-google',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    SHOW: (id: number) => `/products/${id}`,
    SEARCH: '/products/search',
    FILTER: '/products/filter'
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    SHOW: (id: string) => `/categories/${id}`
  },

  // Collections
  COLLECTIONS: {
    LIST: '/collections',
    SHOW: (id: string) => `/collections/${id}`,
    PRODUCTS: (id: string) => `/collections/${id}/products`
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear'
  },

  // Orders
  ORDERS: {
    LIST: '/orders/user',
    SHOW: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    TRACK: (identifier: string) => `/orders/track/${identifier}`
  },

  // Favorites
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites/add',
    REMOVE: '/favorites/remove',
    TOGGLE: '/favorites/toggle'
  },

  // Coupons
  COUPONS: {
    VALIDATE: '/coupons/validate',
    APPLY: '/coupons/apply'
  },

  // Contact
  CONTACT: {
    SEND: '/contact/send'
  },

  // File Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    PAYMENT_SCREENSHOT: '/upload/payment-screenshot'
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CURRENT_CONVERSATION: '/chat/conversations/current',
    MESSAGES: '/chat/messages',
    AI_RESPONSE: '/chat/ai-response',
    REQUEST_HUMAN: '/chat/request-human',
    UPLOAD: '/chat/upload'
  },

  // Configuration
  CONFIG: '/config'
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/') ?
  API_CONFIG.BASE_URL.slice(0, -1) :
  API_CONFIG.BASE_URL;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${baseUrl}${cleanEndpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  let token: string | null = null;
  try {
    token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
  } catch {
    token = null;
  }

  return token ?
  { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` } :
  API_CONFIG.DEFAULT_HEADERS;
};