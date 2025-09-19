// API Configuration for Backend Integration
export const API_CONFIG = {
  // Base URL - prefer VITE_API_URL, fallback to local development
  BASE_URL: (() => {
    // Check for environment variable first
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }

    // Use localhost for development
    return 'http://localhost:3001/api';
  })(),

  // API Version
  VERSION: 'v1',

  // Timeout settings - reduced for faster fallback
  TIMEOUT: 10000,

  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },

  // Authentication
  AUTH_TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',

  // Offline mode flag
  OFFLINE_MODE: false
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
  // If in offline mode, return a placeholder that will trigger fallbacks
  if (API_CONFIG.OFFLINE_MODE) {
    return 'offline://api';
  }

  // Check if BASE_URL contains 'local://' which indicates Node.js API usage
  if (API_CONFIG.BASE_URL.includes('local://')) {
    return 'local://api'; // This will be handled by the Node.js API system
  }

  const baseUrl = API_CONFIG.BASE_URL.endsWith('/') 
    ? API_CONFIG.BASE_URL.slice(0, -1) 
    : API_CONFIG.BASE_URL;

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

  return token 
    ? { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : API_CONFIG.DEFAULT_HEADERS;
};