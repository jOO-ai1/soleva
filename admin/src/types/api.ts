// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: User;
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

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  preferredLanguage: string;
  twoFactorEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  brand: string;
  status: 'active' | 'inactive' | 'draft';
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingStatus: string;
  timeline: Array<{
    id: string;
    status: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  variant?: {
    size: string;
    color: string;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  image: string;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  sortOrder: number;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit: number;
  validFrom: string;
  validTo?: string;
  freeShipping: boolean;
  isActive: boolean;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

// Flash Sale Types
export interface FlashSale {
  id: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFeatured: boolean;
  bannerImage?: string;
  countdownEnabled: boolean;
  productsCount: number;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'admin' | 'ai';
  timestamp: string;
  isRead: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  lowStockItems: number;
  ordersGrowth: number;
  revenueGrowth: number;
  customersGrowth: number;
}

export interface AnalyticsData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  salesTrend: Array<{
    date: string;
    sales: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    sales: number;
  }>;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

// Settings Types
export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    expressShippingCost: number;
  };
  payment: {
    stripePublicKey: string;
    stripeSecretKey: string;
    paypalClientId: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

// Multi-Store Types
export interface Store {
  id: string;
  name: string | { en: string; ar?: string } | null;
  description: string | { en: string; ar?: string } | null;
  domain: string;
  subdomain: string;
  logo: string;
  favicon: string;
  email: string;
  phone: string;
  address: Record<string, unknown>;
  currency: string;
  timezone: string;
  language: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  productsCount: number;
  ordersCount: number;
  revenue: number;
}

// API Request Types
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorToken?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
  preferredLanguage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  images: string[];
  variants: Omit<ProductVariant, 'id'>[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: 'active' | 'inactive' | 'draft';
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface CreateCouponRequest {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {
  isActive?: boolean;
}

export interface CreateFlashSaleRequest {
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  products: string[];
}

export interface UpdateFlashSaleRequest extends Partial<CreateFlashSaleRequest> {
  isActive?: boolean;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  trackingNumber?: string;
  notes?: string;
}

export interface CreateStoreRequest {
  name: string;
  domain: string;
  settings: SystemSettings;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  isActive?: boolean;
}

// Additional types for admin pages
export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  benefits: Record<string, unknown>;
  isActive: boolean;
  customersCount: number;
  createdAt: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  minSpent: number;
  minOrders: number;
  benefits: Array<{
    discount?: number;
    freeShipping?: boolean;
    pointsMultiplier?: number;
  }>;
  isActive: boolean;
  sortOrder: number;
  customersCount: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  reservedStock: number;
  availableStock: number;
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  supplier?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface StoreProduct {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  price: number;
  comparePrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface StoreInventory {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  warehouse: string;
  shelf: string;
  bin: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StorePromotion {
  id: string;
  storeId: string;
  name: string | { en: string; ar?: string } | null;
  description: string | { en: string; ar?: string } | null;
  type: string;
  value: number;
  targetProducts: string[];
  targetCategories: string[];
  targetCustomers: string[];
  minOrderValue: number;
  maxUsage: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string | null;
  storeDescription: string | null;
  storeLogo: string;
  storeFavicon: string;
  email: string;
  phone: string;
  address: Record<string, unknown>;
  taxNumber: string;
  businessLicense: string;
  currency: string;
  timezone: string;
  language: string;
  socialMedia: Record<string, unknown>;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export interface IntegrationSettings {
  id: string;
  paymentGateway: string;
  shippingProvider: string;
  emailProvider: string;
  smsProvider: string;
  analyticsProvider: string;
  settings: Record<string, unknown>;
}

export interface SecuritySettings {
  id: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  ipWhitelist: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  isActive: boolean;
}
