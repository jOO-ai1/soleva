/**
 * Mock Data Service for Offline/Fallback Mode
 */

export interface MockProduct {
  id: string;
  slug?: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  price: number;
  basePrice?: number;
  salePrice?: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: number[];
  colors: string[];
  category?: {
    id: string;
    name: {en: string;ar: string;};
    slug: string;
  };
  collection?: {
    id: string;
    name: {en: string;ar: string;};
    slug: string;
  };
  isNew?: boolean;
  isFeatured?: boolean;
  inStock: boolean;
  stockCount?: number;
}

export interface MockCategory {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  slug: string;
  image?: string;
  productCount?: number;
}

export interface MockCollection {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  slug: string;
  description?: {
    en: string;
    ar: string;
  };
  image?: string;
  productCount?: number;
}

// Mock products data
const mockProducts: MockProduct[] = [
{
  id: '1',
  slug: 'classic-leather-sneakers',
  name: {
    en: 'Classic Leather Sneakers',
    ar: 'حذاء رياضي جلدي كلاسيكي'
  },
  description: {
    en: 'Premium leather sneakers with comfortable cushioning and classic design.',
    ar: 'حذاء رياضي من الجلد الفاخر مع وسادة مريحة وتصميم كلاسيكي.'
  },
  price: 129.99,
  basePrice: 159.99,
  salePrice: 129.99,
  originalPrice: 159.99,
  discount: 19,
  images: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400'
  ],
  sizes: [38, 39, 40, 41, 42, 43, 44],
  colors: ['Black', 'White', 'Brown'],
  category: {
    id: '1',
    name: { en: 'Sneakers', ar: 'أحذية رياضية' },
    slug: 'sneakers'
  },
  collection: {
    id: '1',
    name: { en: 'Classic Collection', ar: 'المجموعة الكلاسيكية' },
    slug: 'classic'
  },
  isNew: false,
  isFeatured: true,
  inStock: true,
  stockCount: 15
},
{
  id: '2',
  slug: 'running-shoes-pro',
  name: {
    en: 'Running Shoes Pro',
    ar: 'حذاء الجري المحترف'
  },
  description: {
    en: 'High-performance running shoes with advanced cushioning technology.',
    ar: 'حذاء جري عالي الأداء بتقنية وسادة متقدمة.'
  },
  price: 189.99,
  basePrice: 189.99,
  images: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400'
  ],
  sizes: [38, 39, 40, 41, 42, 43, 44, 45],
  colors: ['Blue', 'Red', 'Black'],
  category: {
    id: '2',
    name: { en: 'Running', ar: 'الجري' },
    slug: 'running'
  },
  collection: {
    id: '2',
    name: { en: 'Sport Collection', ar: 'المجموعة الرياضية' },
    slug: 'sport'
  },
  isNew: true,
  isFeatured: true,
  inStock: true,
  stockCount: 8
},
{
  id: '3',
  slug: 'casual-loafers',
  name: {
    en: 'Casual Loafers',
    ar: 'حذاء كاجوال'
  },
  description: {
    en: 'Comfortable casual loafers perfect for everyday wear.',
    ar: 'حذاء كاجوال مريح مثالي للاستخدام اليومي.'
  },
  price: 79.99,
  basePrice: 99.99,
  salePrice: 79.99,
  originalPrice: 99.99,
  discount: 20,
  images: [
    'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=400'
  ],
  sizes: [39, 40, 41, 42, 43],
  colors: ['Brown', 'Black', 'Tan'],
  category: {
    id: '3',
    name: { en: 'Casual', ar: 'كاجوال' },
    slug: 'casual'
  },
  inStock: true,
  isFeatured: false,
  stockCount: 12
},
{
  id: '4',
  slug: 'formal-oxford-shoes',
  name: {
    en: 'Formal Oxford Shoes',
    ar: 'حذاء أوكسفورد رسمي'
  },
  description: {
    en: 'Elegant Oxford shoes for formal occasions and business wear.',
    ar: 'حذاء أوكسفورد أنيق للمناسبات الرسمية والعمل.'
  },
  price: 199.99,
  basePrice: 199.99,
  images: [
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400'
  ],
  sizes: [38, 39, 40, 41, 42, 43, 44],
  colors: ['Black', 'Brown'],
  category: {
    id: '4',
    name: { en: 'Formal', ar: 'رسمي' },
    slug: 'formal'
  },
  collection: {
    id: '3',
    name: { en: 'Business Collection', ar: 'مجموعة الأعمال' },
    slug: 'business'
  },
  inStock: true,
  isFeatured: false,
  stockCount: 5
},
{
  id: '5',
  slug: 'summer-sandals',
  name: {
    en: 'Summer Sandals',
    ar: 'صندل صيفي'
  },
  description: {
    en: 'Comfortable summer sandals with adjustable straps.',
    ar: 'صندل صيفي مريح بأحزمة قابلة للتعديل.'
  },
  price: 49.99,
  basePrice: 49.99,
  images: [
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400'
  ],
  sizes: [38, 39, 40, 41, 42, 43],
  colors: ['Brown', 'Black', 'Tan'],
  category: {
    id: '5',
    name: { en: 'Sandals', ar: 'صنادل' },
    slug: 'sandals'
  },
  isNew: true,
  isFeatured: true,
  inStock: true,
  stockCount: 20
}];


// Mock categories data
const mockCategories: MockCategory[] = [
{
  id: '1',
  name: { en: 'Sneakers', ar: 'أحذية رياضية' },
  slug: 'sneakers',
  image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300',
  productCount: 1
},
{
  id: '2',
  name: { en: 'Running', ar: 'الجري' },
  slug: 'running',
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
  productCount: 1
},
{
  id: '3',
  name: { en: 'Casual', ar: 'كاجوال' },
  slug: 'casual',
  image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300',
  productCount: 1
},
{
  id: '4',
  name: { en: 'Formal', ar: 'رسمي' },
  slug: 'formal',
  image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300',
  productCount: 1
},
{
  id: '5',
  name: { en: 'Sandals', ar: 'صنادل' },
  slug: 'sandals',
  image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300',
  productCount: 1
}];


// Mock collections data
const mockCollections: MockCollection[] = [
{
  id: '1',
  name: { en: 'Classic Collection', ar: 'المجموعة الكلاسيكية' },
  slug: 'classic',
  description: {
    en: 'Timeless designs that never go out of style',
    ar: 'تصاميم خالدة لا تخرج عن الموضة أبداً'
  },
  image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
  productCount: 1
},
{
  id: '2',
  name: { en: 'Sport Collection', ar: 'المجموعة الرياضية' },
  slug: 'sport',
  description: {
    en: 'High-performance athletic footwear',
    ar: 'أحذية رياضية عالية الأداء'
  },
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  productCount: 1
},
{
  id: '3',
  name: { en: 'Business Collection', ar: 'مجموعة الأعمال' },
  slug: 'business',
  description: {
    en: 'Professional footwear for the workplace',
    ar: 'أحذية مهنية لمكان العمل'
  },
  image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400',
  productCount: 1
}];


// Export functions
export const getMockProducts = (): MockProduct[] => {
  return [...mockProducts];
};

export const getMockCategories = (): MockCategory[] => {
  return [...mockCategories];
};

export const getMockCollections = (): MockCollection[] => {
  return [...mockCollections];
};

export const getMockProductById = (id: string): MockProduct | undefined => {
  return mockProducts.find((product) => product.id === id);
};

export const getMockProductsByCategory = (categorySlug: string): MockProduct[] => {
  return mockProducts.filter((product) => product.category?.slug === categorySlug);
};

export const getMockProductsByCollection = (collectionSlug: string): MockProduct[] => {
  return mockProducts.filter((product) => product.collection?.slug === collectionSlug);
};

export const searchMockProducts = (query: string): MockProduct[] => {
  const searchTerm = query.toLowerCase();
  return mockProducts.filter((product) =>
  product.name.en.toLowerCase().includes(searchTerm) ||
  product.name.ar.toLowerCase().includes(searchTerm) ||
  product.description.en.toLowerCase().includes(searchTerm) ||
  product.description.ar.toLowerCase().includes(searchTerm) ||
  product.category?.name.en.toLowerCase().includes(searchTerm) ||
  product.category?.name.ar.toLowerCase().includes(searchTerm)
  );
};

// Cache management for offline mode
export const cacheData = {
  products: mockProducts,
  categories: mockCategories,
  collections: mockCollections,
  lastUpdated: Date.now()
};

export const isCacheValid = (maxAge: number = 5 * 60 * 1000): boolean => {
  return Date.now() - cacheData.lastUpdated < maxAge;
};