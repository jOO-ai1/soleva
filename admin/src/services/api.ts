import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: any;
  requiresTwoFactor?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string, twoFactorToken?: string) => {
    const response = await api.post<ApiResponse>('/auth/admin/login', {
      email,
      password,
      twoFactorToken,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put<ApiResponse>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put<ApiResponse>('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get<ApiResponse>('/admin/dashboard/stats');
    return response.data;
  },

  getRecentOrders: async () => {
    const response = await api.get<ApiResponse>('/admin/dashboard/recent-orders');
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    status?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/products', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/products/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/products', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/products/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse>('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/orders', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const response = await api.put<ApiResponse>(`/admin/orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  processRefund: async (id: string, amount: number, reason: string) => {
    const response = await api.post<ApiResponse>(`/admin/orders/${id}/refund`, {
      amount,
      reason,
    });
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/customers', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/customers/${id}`);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/customers/${id}`, data);
    return response.data;
  },

  getOrderHistory: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/customers/${id}/orders`);
    return response.data;
  },
};

// Users API (Admin Users)
export const usersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/users/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSalesData: async (period: string) => {
    const response = await api.get<ApiResponse>(`/admin/analytics/sales?period=${period}`);
    return response.data;
  },

  getTopProducts: async (period: string) => {
    const response = await api.get<ApiResponse>(`/admin/analytics/top-products?period=${period}`);
    return response.data;
  },

  getCustomerInsights: async (period: string) => {
    const response = await api.get<ApiResponse>(`/admin/analytics/customers?period=${period}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getConversations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/chat/conversations', { params });
    return response.data;
  },

  getConversation: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/chat/conversations/${id}`);
    return response.data;
  },

  sendMessage: async (conversationId: string, message: string) => {
    const response = await api.post<ApiResponse>(`/admin/chat/conversations/${conversationId}/messages`, {
      message,
    });
    return response.data;
  },

  updateStatus: async (conversationId: string, status: string) => {
    const response = await api.put<ApiResponse>(`/admin/chat/conversations/${conversationId}/status`, {
      status,
    });
    return response.data;
  },
};

export default api;
