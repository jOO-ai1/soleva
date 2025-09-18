import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Product,
  Order,
  DashboardStats,
  AnalyticsData,
  UpdateProfileRequest,
  CreateProductRequest,
  UpdateProductRequest } from
'../types/api';

// API Configuration
const API_BASE_URL = (import.meta as {env?: {VITE_API_URL?: string;VITE_API_BASE_URL?: string;};}).env?.VITE_API_URL ||
(import.meta as {env?: {VITE_API_URL?: string;VITE_API_BASE_URL?: string;};}).env?.VITE_API_BASE_URL ||
process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
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

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.';
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return Promise.reject(error);
  }
);

// Re-export types for convenience
export type { ApiResponse, PaginatedResponse } from '../types/api';

// Auth API
export const authAPI = {
  login: async (email: string, password: string, twoFactorToken?: string): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/admin/login', {
      email,
      password,
      twoFactorToken
    });
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>('/auth/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return response.data;
  },

  getRecentOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get<ApiResponse<Order[]>>('/admin/dashboard/recent-orders');
    return response.data;
  },

  getAnalytics: async (period: string = '30d'): Promise<ApiResponse<AnalyticsData>> => {
    const response = await api.get<ApiResponse<AnalyticsData>>(`/admin/dashboard/analytics?period=${period}`);
    return response.data;
  }
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
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/admin/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductRequest): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>('/admin/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/admin/products/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse>('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
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
      notes
    });
    return response.data;
  },

  processRefund: async (id: string, amount: number, reason: string) => {
    const response = await api.post<ApiResponse>(`/admin/orders/${id}/refund`, {
      amount,
      reason
    });
    return response.data;
  }
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

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/customers', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/customers/${id}`);
    return response.data;
  },

  getSegments: async () => {
    const response = await api.get<ApiResponse>('/admin/customer-segments');
    return response.data;
  },

  createSegment: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/customer-segments', data);
    return response.data;
  },

  updateSegment: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/customer-segments/${id}`, data);
    return response.data;
  },

  deleteSegment: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/customer-segments/${id}`);
    return response.data;
  }
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
  }
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
  }
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/categories/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/categories', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/categories/${id}`);
    return response.data;
  },

  reorder: async (updates: Array<{id: string;sortOrder: number;}>) => {
    const response = await api.put<ApiResponse>('/admin/categories/reorder', updates);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse>('/upload/category', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Flash Sales API
export const flashSalesAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/flash-sales');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/flash-sales/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/flash-sales', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/flash-sales/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/flash-sales/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse>('/upload/flash-sale', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Coupons API
export const couponsAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/coupons');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/coupons/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/coupons', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/coupons/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/coupons/${id}`);
    return response.data;
  }
};

// Inventory API
export const inventoryAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/inventory');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/inventory/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/inventory', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/inventory/${id}`);
    return response.data;
  },

  getPurchaseOrders: async () => {
    const response = await api.get<ApiResponse>('/admin/purchase-orders');
    return response.data;
  },

  createPurchaseOrder: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/purchase-orders', data);
    return response.data;
  },

  updatePurchaseOrder: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/purchase-orders/${id}`, data);
    return response.data;
  }
};

// Suppliers API
export const suppliersAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/suppliers');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse>(`/admin/suppliers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/suppliers/${id}`);
    return response.data;
  }
};


// Loyalty API
export const loyaltyAPI = {
  getTiers: async () => {
    const response = await api.get<ApiResponse>('/admin/loyalty-tiers');
    return response.data;
  },

  createTier: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/loyalty-tiers', data);
    return response.data;
  },

  updateTier: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/loyalty-tiers/${id}`, data);
    return response.data;
  },

  deleteTier: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/loyalty-tiers/${id}`);
    return response.data;
  },

  getTransactions: async (customerId?: string) => {
    const params = customerId ? { customerId } : {};
    const response = await api.get<ApiResponse>('/admin/loyalty-transactions', { params });
    return response.data;
  },

  adjustPoints: async (customerId: string, points: number, description: string) => {
    const response = await api.post<ApiResponse>('/admin/loyalty-transactions', {
      customerId,
      points,
      description,
      type: 'ADJUSTED'
    });
    return response.data;
  }
};

// Wishlist API
export const wishlistAPI = {
  getAll: async () => {
    const response = await api.get<ApiResponse>('/admin/wishlists');
    return response.data;
  },

  getByCustomer: async (customerId: string) => {
    const response = await api.get<ApiResponse>(`/admin/wishlists/customer/${customerId}`);
    return response.data;
  },

  getItems: async (wishlistId: string) => {
    const response = await api.get<ApiResponse>(`/admin/wishlists/${wishlistId}/items`);
    return response.data;
  },

  createTargetedOffer: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/targeted-offers', data);
    return response.data;
  },

  getTargetedOffers: async () => {
    const response = await api.get<ApiResponse>('/admin/targeted-offers');
    return response.data;
  },

  sendTargetedOffer: async (offerId: string, customerIds: string[]) => {
    const response = await api.post<ApiResponse>(`/admin/targeted-offers/${offerId}/send`, {
      customerIds
    });
    return response.data;
  }
};

// Settings API
export const settingsAPI = {
  getStoreSettings: async () => {
    const response = await api.get<ApiResponse>('/admin/settings/store');
    return response.data;
  },

  updateStoreSettings: async (data: any) => {
    const response = await api.put<ApiResponse>('/admin/settings/store', data);
    return response.data;
  },

  getIntegrationSettings: async () => {
    const response = await api.get<ApiResponse>('/admin/settings/integrations');
    return response.data;
  },

  updateIntegrationSettings: async (data: any) => {
    const response = await api.put<ApiResponse>('/admin/settings/integrations', data);
    return response.data;
  },

  getSecuritySettings: async () => {
    const response = await api.get<ApiResponse>('/admin/settings/security');
    return response.data;
  },

  updateSecuritySettings: async (data: any) => {
    const response = await api.put<ApiResponse>('/admin/settings/security', data);
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get<ApiResponse>('/admin/roles');
    return response.data;
  },

  createRole: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/roles/${id}`);
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get<ApiResponse>('/admin/permissions');
    return response.data;
  }
};

// Multi-Store API
export const multiStoreAPI = {
  getStores: async () => {
    const response = await api.get<ApiResponse>('/admin/multi-store/stores');
    return response.data;
  },

  createStore: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/multi-store/stores', data);
    return response.data;
  },

  updateStore: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/multi-store/stores/${id}`, data);
    return response.data;
  },

  deleteStore: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/multi-store/stores/${id}`);
    return response.data;
  },

  getStoreProducts: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get<ApiResponse>('/admin/multi-store/products', { params });
    return response.data;
  },

  updateStoreProduct: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/multi-store/products/${id}`, data);
    return response.data;
  },

  getStoreInventory: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get<ApiResponse>('/admin/multi-store/inventory', { params });
    return response.data;
  },

  updateStoreInventory: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/multi-store/inventory/${id}`, data);
    return response.data;
  },

  getStorePromotions: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const response = await api.get<ApiResponse>('/admin/multi-store/promotions', { params });
    return response.data;
  },

  createStorePromotion: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/multi-store/promotions', data);
    return response.data;
  },

  updateStorePromotion: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/multi-store/promotions/${id}`, data);
    return response.data;
  },

  deleteStorePromotion: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/multi-store/promotions/${id}`);
    return response.data;
  }
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
      message
    });
    return response.data;
  },

  updateStatus: async (conversationId: string, status: string) => {
    const response = await api.put<ApiResponse>(`/admin/chat/conversations/${conversationId}/status`, {
      status
    });
    return response.data;
  },

  getChatBots: async () => {
    const response = await api.get<ApiResponse>('/admin/chat/bots');
    return response.data;
  },

  createChatBot: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/chat/bots', data);
    return response.data;
  },

  updateChatBot: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/chat/bots/${id}`, data);
    return response.data;
  },

  deleteChatBot: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/chat/bots/${id}`);
    return response.data;
  },

  getEscalationRules: async () => {
    const response = await api.get<ApiResponse>('/admin/chat/escalation-rules');
    return response.data;
  },

  createEscalationRule: async (data: any) => {
    const response = await api.post<ApiResponse>('/admin/chat/escalation-rules', data);
    return response.data;
  },

  updateEscalationRule: async (id: string, data: any) => {
    const response = await api.put<ApiResponse>(`/admin/chat/escalation-rules/${id}`, data);
    return response.data;
  },

  deleteEscalationRule: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/admin/chat/escalation-rules/${id}`);
    return response.data;
  }
};

export default api;