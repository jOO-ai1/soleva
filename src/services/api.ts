import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api';

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
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
          errors: data.errors || {},
          status: response.status,
        } as ApiError;
      }

      return {
        data: data.data || data,
        message: data.message,
        status: response.status,
        success: true,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
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
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
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
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Upload failed',
        errors: data.errors || {},
        status: response.status,
      } as ApiError;
    }

    return {
      data: data.data || data,
      message: data.message,
      status: response.status,
      success: true,
    };
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Specific API service functions
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  
  register: (userData: { name: string; email: string; password: string; password_confirmation: string }) =>
    apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  
  logout: () =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  
  getProfile: () =>
    apiClient.get(API_ENDPOINTS.AUTH.PROFILE),
  
  updateProfile: (data: any) =>
    apiClient.put(API_ENDPOINTS.AUTH.PROFILE, data),
};

export const productsApi = {
  getAll: (params?: { page?: number; per_page?: number; search?: string; collection?: string }) =>
    apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  getById: (id: number) =>
    apiClient.get(API_ENDPOINTS.PRODUCTS.SHOW(id)),
  
  search: (query: string) =>
    apiClient.get(`${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`),
};

export const collectionsApi = {
  getAll: () =>
    apiClient.get(API_ENDPOINTS.COLLECTIONS.LIST),
  
  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.COLLECTIONS.SHOW(id)),
  
  getProducts: (id: string) =>
    apiClient.get(API_ENDPOINTS.COLLECTIONS.PRODUCTS(id)),
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
    apiClient.delete(API_ENDPOINTS.CART.CLEAR),
};

export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST + queryParams);
  },
  
  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.ORDERS.SHOW(id)),
  
  create: (orderData: any) =>
    apiClient.post(API_ENDPOINTS.ORDERS.CREATE, orderData),
  
  track: (identifier: string) =>
    apiClient.get(API_ENDPOINTS.ORDERS.TRACK(identifier)),
};

export const favoritesApi = {
  getAll: () =>
    apiClient.get(API_ENDPOINTS.FAVORITES.LIST),
  
  add: (productId: number) =>
    apiClient.post(API_ENDPOINTS.FAVORITES.ADD, { product_id: productId }),
  
  remove: (productId: number) =>
    apiClient.delete(`${API_ENDPOINTS.FAVORITES.REMOVE}/${productId}`),
  
  toggle: (productId: number) =>
    apiClient.post(API_ENDPOINTS.FAVORITES.TOGGLE, { product_id: productId }),
};

export const couponsApi = {
  validate: (code: string) =>
    apiClient.post(API_ENDPOINTS.COUPONS.VALIDATE, { code }),
  
  apply: (code: string, cartTotal: number) =>
    apiClient.post(API_ENDPOINTS.COUPONS.APPLY, { code, cart_total: cartTotal }),
};

export const contactApi = {
  send: (contactData: { name: string; email: string; subject: string; message: string }) =>
    apiClient.post(API_ENDPOINTS.CONTACT.SEND, contactData),
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
  },
};