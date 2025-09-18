import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api';

// Exponential backoff with jitter
async function retryWithBackoff<T>(fn: () => Promise<T>, opts?: {retries?: number;baseMs?: number;maxMs?: number;}): Promise<T> {
  const retries = opts?.retries ?? 3;
  const baseMs = opts?.baseMs ?? 300;
  const maxMs = opts?.maxMs ?? 3000;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const jitter = Math.random() * baseMs;
      const delay = Math.min(baseMs * 2 ** attempt + jitter, maxMs);
      await new Promise((res) => setTimeout(res, delay));
      attempt += 1;
    }
  }
  throw lastError;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timeout')), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

// Generic API response type
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Error response type
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Generic API client class
class ApiClient {
  private async request<T>(
  endpoint: string,
  options: RequestInit = {})
  : Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    try {
      const doFetch = async () => {
        const response = await withTimeout(fetch(url, config), API_CONFIG.TIMEOUT);
        let data: any = null;
        // Some endpoints may return 204 No Content
        if (response.status !== 204) {
          try {
            data = await response.json();
          } catch {
            data = null;
          }
        }

        if (!response.ok) {
          // Retry on 5xx
          if (response.status >= 500) {
            throw new Error(`Server error ${response.status}`);
          }
          throw {
            message: data && (data.message || data.error) || 'An error occurred',
            errors: data && data.errors || {},
            status: response.status
          } as ApiError;
        }

        return {
          data: (data && (data.data || data)) as T,
          message: data?.message,
          status: response.status,
          success: true
        } as ApiResponse<T>;
      };

      return await retryWithBackoff(() => doFetch());
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0
        } as ApiError;
      }
      if (error instanceof Error && error.message === 'Request timeout') {
        throw {
          message: 'Request timeout. Please try again.',
          status: 0
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Upload failed',
        errors: data.errors || {},
        status: response.status
      } as ApiError;
    }

    return {
      data: data.data || data,
      message: data.message,
      status: response.status,
      success: true
    };
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Specific API service functions
export const authApi = {
  login: (credentials: {email: string;password: string;}) =>
  apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),

  register: (userData: {name: string;email: string;phoneNumber: string;password: string;password_confirmation: string;}) =>
  apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),

  logout: () =>
  apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),

  getProfile: () =>
  apiClient.get(API_ENDPOINTS.AUTH.PROFILE),

  updateProfile: (data: any) =>
  apiClient.put(API_ENDPOINTS.AUTH.PROFILE, data),

  disconnectGoogle: () =>
  apiClient.post(API_ENDPOINTS.AUTH.DISCONNECT_GOOGLE),

  forgotPassword: (data: {email: string;phoneNumber: string;}) =>
  apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data),

  resetPassword: (data: {token: string;newPassword: string;}) =>
  apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data)
};

export const productsApi = {
  getAll: (params?: {page?: number;per_page?: number;search?: string;collection?: string;}) => {
    // Use Supabase API instead of external API
    try {
      const { supabaseProductsApi } = require('./supabaseApi');
      return supabaseProductsApi.getAll(params);
    } catch (error) {
      console.error('API connection error:', error);
      // Return empty data as fallback
      return Promise.resolve({
        data: [],
        status: 200,
        success: true
      });
    }
  },

  getById: (id: number) => {
    try {
      const { supabaseProductsApi } = require('./supabaseApi');
      return supabaseProductsApi.getById(id);
    } catch (error) {
      console.error('API connection error:', error);
      throw {
        message: 'Product not found',
        status: 404
      } as ApiError;
    }
  },

  search: (query: string) => {
    try {
      const { supabaseProductsApi } = require('./supabaseApi');
      return supabaseProductsApi.getAll({ search: query });
    } catch (error) {
      console.error('API connection error:', error);
      return Promise.resolve({
        data: [],
        status: 200,
        success: true
      });
    }
  }
};

export const collectionsApi = {
  getAll: () => {
    try {
      const { supabaseCollectionsApi } = require('./supabaseApi');
      return supabaseCollectionsApi.getAll();
    } catch (error) {
      console.error('API connection error:', error);
      return Promise.resolve({
        data: [],
        status: 200,
        success: true
      });
    }
  },

  getById: (id: string) => {
    try {
      const { supabaseCollectionsApi } = require('./supabaseApi');
      return supabaseCollectionsApi.getAll();
    } catch (error) {
      console.error('API connection error:', error);
      return Promise.resolve({
        data: [],
        status: 200,
        success: true
      });
    }
  },

  getProducts: (id: string) => {
    try {
      const { supabaseProductsApi } = require('./supabaseApi');
      return supabaseProductsApi.getAll({ collection: id });
    } catch (error) {
      console.error('API connection error:', error);
      return Promise.resolve({
        data: [],
        status: 200,
        success: true
      });
    }
  }
};

export const cartApi = {
  get: () =>
  apiClient.get(API_ENDPOINTS.CART.GET),

  add: (productId: number, color: string, size: number, quantity: number = 1) =>
  apiClient.post(API_ENDPOINTS.CART.ADD, { product_id: productId, color, size, quantity }),

  update: (itemId: number, quantity: number) =>
  apiClient.put(API_ENDPOINTS.CART.UPDATE, { item_id: itemId, quantity }),

  remove: (itemId: number) =>
  apiClient.delete(`${API_ENDPOINTS.CART.REMOVE}/${itemId}`),

  clear: () =>
  apiClient.delete(API_ENDPOINTS.CART.CLEAR)
};

export const ordersApi = {
  getAll: (params?: {page?: number;limit?: number;}) => {
    const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST + queryParams);
  },

  getById: (id: string) =>
  apiClient.get(API_ENDPOINTS.ORDERS.SHOW(id)),

  create: (orderData: any) =>
  apiClient.post(API_ENDPOINTS.ORDERS.CREATE, orderData),

  track: (identifier: string) =>
  apiClient.get(API_ENDPOINTS.ORDERS.TRACK(identifier))
};

export const favoritesApi = {
  getAll: () =>
  apiClient.get(API_ENDPOINTS.FAVORITES.LIST),

  add: (productId: number) =>
  apiClient.post(API_ENDPOINTS.FAVORITES.ADD, { product_id: productId }),

  remove: (productId: number) =>
  apiClient.delete(`${API_ENDPOINTS.FAVORITES.REMOVE}/${productId}`),

  toggle: (productId: number) =>
  apiClient.post(API_ENDPOINTS.FAVORITES.TOGGLE, { product_id: productId })
};

export const couponsApi = {
  validate: (code: string) =>
  apiClient.post(API_ENDPOINTS.COUPONS.VALIDATE, { code }),

  apply: (code: string, cartTotal: number) =>
  apiClient.post(API_ENDPOINTS.COUPONS.APPLY, { code, cart_total: cartTotal })
};

export const contactApi = {
  send: (contactData: {name: string;email: string;subject: string;message: string;}) =>
  apiClient.post(API_ENDPOINTS.CONTACT.SEND, contactData)
};

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload(API_ENDPOINTS.UPLOAD.IMAGE, formData);
  },

  paymentScreenshot: (file: File, orderId?: number) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    if (orderId) {
      formData.append('order_id', orderId.toString());
    }
    return apiClient.upload(API_ENDPOINTS.UPLOAD.PAYMENT_SCREENSHOT, formData);
  }
};