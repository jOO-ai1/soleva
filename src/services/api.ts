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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
        // Check if we should skip network request
        if (url.startsWith('offline://')) {
          throw new Error('Offline mode - using fallback data');
        }

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
          // Retry on 5xx server errors
          if (response.status >= 500) {
            throw new Error(`Server error ${response.status}`);
          }

          // For 4xx errors, don't retry but throw with proper structure
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
      // Network-related errors - these should trigger fallback logic
      if (error instanceof TypeError ||
          (error instanceof Error && (
            error.message.includes('Failed to fetch') ||
            error.message.includes('Offline mode') ||
            error.message.includes('net::ERR_CONNECTION_REFUSED') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_INTERNET_DISCONNECTED')
          ))
      ) {
        // Don't throw error for network issues - return offline response
        console.info('🔄 API connection failed, gracefully falling back to offline mode:', error.message);
        throw {
          message: 'Using offline data due to network connectivity issues',
          status: 0,
          offline: true,
          fallback: true
        } as ApiError & {offline: boolean;fallback: boolean;};
      }

      if (error instanceof Error && error.message === 'Request timeout') {
        throw {
          message: 'Request timeout. Using cached data if available.',
          status: 0,
          offline: true
        } as ApiError & {offline: boolean;};
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

    const headers = token 
      ? { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
      : API_CONFIG.DEFAULT_HEADERS;

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
  apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),

  refreshToken: () =>
  apiClient.post(API_ENDPOINTS.AUTH.REFRESH),

  verifyEmail: (token: string) =>
  apiClient.post('/auth/verify-email', { token })
};

export const productsApi = {
  getAll: async (params?: {page?: number;per_page?: number;search?: string;collection?: string;}) => {
    try {
      // Use local Node.js API endpoints
      const response = await window.ezsite.apis.run({
        path: 'products',
        param: [params]
      });

      console.info('✅ Successfully loaded products from local API');
      return {
        data: response.data || response,
        status: 200,
        success: true,
        message: 'Loaded from local API'
      };
    } catch (error) {
      console.info('🔄 Local API failed, using fallback data:', error.message || error);

      // Enhanced fallback with error context
      const { getMockProducts } = await import('./mockData');
      const mockProducts = getMockProducts();

      // Apply same filtering logic as above
      let filteredProducts = mockProducts;

      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter((product) =>
        product.name.en.toLowerCase().includes(searchTerm) ||
        product.name.ar.toLowerCase().includes(searchTerm) ||
        product.description.en.toLowerCase().includes(searchTerm) ||
        product.description.ar.toLowerCase().includes(searchTerm)
        );
      }

      if (params?.collection) {
        filteredProducts = filteredProducts.filter((product) =>
        product.collection?.slug === params.collection
        );
      }

      return Promise.resolve({
        data: filteredProducts,
        status: 200,
        success: true,
        message: 'Using offline data due to API connectivity issues',
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getById: async (id: number) => {
    try {
      const response = await window.ezsite.apis.run({
        path: 'product',
        param: [id]
      });

      return {
        data: response,
        status: 200,
        success: true,
        message: 'Loaded from local API'
      };
    } catch (error) {
      console.info('🔄 Using fallback data for product ID:', id, error.message || error);
      // Try to find product in mock data
      const { getMockProducts } = await import('./mockData');
      const mockProducts = getMockProducts();
      const product = mockProducts.find((p) => p.id === id.toString());

      if (product) {
        return Promise.resolve({
          data: product,
          status: 200,
          success: true,
          message: 'Using offline data'
        });
      }

      throw {
        message: 'Product not found',
        status: 404
      } as ApiError;
    }
  },

  search: async (query: string) => {
    try {
      const { supabaseProductsApi } = await import('./supabaseApi');
      return await supabaseProductsApi.getAll({ search: query });
    } catch (error) {
      console.info('🔄 Using fallback data for search:', query, error.message || error);
      const { getMockProducts } = await import('./mockData');
      const mockProducts = getMockProducts();
      const filteredProducts = mockProducts.filter((product) =>
      product.name.en.toLowerCase().includes(query.toLowerCase()) ||
      product.name.ar.toLowerCase().includes(query.toLowerCase()) ||
      product.description.en.toLowerCase().includes(query.toLowerCase()) ||
      product.description.ar.toLowerCase().includes(query.toLowerCase())
      );

      return Promise.resolve({
        data: filteredProducts,
        status: 200,
        success: true,
        message: 'Using offline data'
      });
    }
  }
};

export const categoriesApi = {
  getAll: async () => {
    try {
      const response = await window.ezsite.apis.run({
        path: 'categories',
        param: []
      });

      return {
        data: response,
        status: 200,
        success: true,
        message: 'Loaded from local API'
      };
    } catch (error) {
      console.info('🔄 Using fallback data for categories:', error.message || error);
      const { getMockCategories } = await import('./mockData');
      return Promise.resolve({
        data: getMockCategories(),
        status: 200,
        success: true,
        message: 'Using offline data'
      });
    }
  }
};

export const collectionsApi = {
  getAll: async () => {
    try {
      const response = await window.ezsite.apis.run({
        path: 'collections',
        param: []
      });

      return {
        data: response,
        status: 200,
        success: true,
        message: 'Loaded from local API'
      };
    } catch (error) {
      console.info('🔄 Using fallback data for collections:', error.message || error);
      const { getMockCollections } = await import('./mockData');
      return Promise.resolve({
        data: getMockCollections(),
        status: 200,
        success: true,
        message: 'Using offline data'
      });
    }
  },

  getById: async (id: string) => {
    try {
      const { supabaseCollectionsApi } = await import('./supabaseApi');
      return await supabaseCollectionsApi.getAll();
    } catch (error) {
      console.info('🔄 Using fallback data for collection:', id, error.message || error);
      const { getMockCollections } = await import('./mockData');
      const mockCollections = getMockCollections();
      const collection = mockCollections.find((c) => c.slug === id);

      if (collection) {
        return Promise.resolve({
          data: [collection],
          status: 200,
          success: true,
          message: 'Using offline data'
        });
      }

      return Promise.resolve({
        data: [],
        status: 200,
        success: true,
        message: 'Collection not found'
      });
    }
  },

  getProducts: async (id: string) => {
    try {
      const { supabaseProductsApi } = await import('./supabaseApi');
      return await supabaseProductsApi.getAll({ collection: id });
    } catch (error) {
      console.info('🔄 Using fallback data for collection products:', id, error.message || error);
      const { getMockProducts } = await import('./mockData');
      const mockProducts = getMockProducts();
      const filteredProducts = mockProducts.filter((product) =>
      product.collection && product.collection.slug === id
      );

      return Promise.resolve({
        data: filteredProducts,
        status: 200,
        success: true,
        message: 'Using offline data'
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