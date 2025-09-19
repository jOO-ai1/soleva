/**
 * Mock Data Service for Offline/Fallback Mode
 * Provides sample data when backend is unavailable
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  brand: string;
  sizes: string[];
  colors: string[];
  isOnSale: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string;
  productsCount: number;
  isActive: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured: boolean;
  productsCount: number;
  isActive: boolean;
}

// Sample products for fallback mode
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Classic Oxford Leather Shoes',
    description: 'Premium handcrafted leather oxford shoes perfect for formal occasions.',
    price: 899,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80'
    ],
    category: 'formal',
    brand: 'Soleva',
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Black', 'Brown'],
    isOnSale: true,
    isFeatured: true,
    isNew: false,
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    stockQuantity: 15
  },
  {
    id: 2,
    name: 'Casual Sneakers',
    description: 'Comfortable everyday sneakers with modern design.',
    price: 549,
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&q=80'
    ],
    category: 'casual',
    brand: 'Soleva',
    sizes: ['39', '40', '41', '42', '43'],
    colors: ['White', 'Gray'],
    isOnSale: false,
    isFeatured: true,
    isNew: true,
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    stockQuantity: 25
  },
  {
    id: 3,
    name: 'Sport Running Shoes',
    description: 'High-performance running shoes with advanced cushioning.',
    price: 799,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    ],
    category: 'sports',
    brand: 'Soleva',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Blue', 'Red'],
    isOnSale: false,
    isFeatured: false,
    isNew: true,
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockQuantity: 8
  },
  {
    id: 4,
    name: 'Elegant High Heels',
    description: 'Sophisticated high heel shoes for special occasions.',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80'
    ],
    category: 'heels',
    brand: 'Soleva',
    sizes: ['36', '37', '38', '39', '40'],
    colors: ['Black', 'Red', 'Nude'],
    isOnSale: false,
    isFeatured: true,
    isNew: false,
    rating: 4.6,
    reviewCount: 78,
    inStock: true,
    stockQuantity: 12
  }
];

const mockCategories: Category[] = [
  {
    id: 'formal',
    name: 'Formal Shoes',
    slug: 'formal',
    description: 'Professional and formal footwear',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80',
    productsCount: 45,
    isActive: true
  },
  {
    id: 'casual',
    name: 'Casual Shoes',
    slug: 'casual', 
    description: 'Comfortable everyday footwear',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=300&q=80',
    productsCount: 67,
    isActive: true
  },
  {
    id: 'sports',
    name: 'Sports Shoes',
    slug: 'sports',
    description: 'Athletic and performance footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
    productsCount: 89,
    isActive: true
  },
  {
    id: 'heels',
    name: 'High Heels',
    slug: 'heels',
    description: 'Elegant and sophisticated heels',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80',
    productsCount: 34,
    isActive: true
  }
];

const mockCollections: Collection[] = [
  {
    id: 'summer-2024',
    name: 'Summer Collection 2024',
    slug: 'summer-2024',
    description: 'Fresh styles for the summer season',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&q=80',
    isFeatured: true,
    productsCount: 28,
    isActive: true
  },
  {
    id: 'professional',
    name: 'Professional Line',
    slug: 'professional',
    description: 'Sophisticated footwear for the workplace',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
    isFeatured: true,
    productsCount: 42,
    isActive: true
  },
  {
    id: 'weekend-casual',
    name: 'Weekend Casual',
    slug: 'weekend-casual',
    description: 'Relaxed styles for your days off',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&q=80',
    isFeatured: false,
    productsCount: 35,
    isActive: true
  }
];

class MockDataService {
  private isOfflineMode = false;

  setOfflineMode(offline: boolean) {
    this.isOfflineMode = offline;
    console.log(`🔄 Mock data service ${offline ? 'enabled' : 'disabled'}`);
  }

  isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  // Simulate API delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getProducts(filters?: any): Promise<{ success: boolean; data: Product[] }> {
    await this.delay();
    
    let products = [...mockProducts];
    
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    
    if (filters?.featured) {
      products = products.filter(p => p.isFeatured);
    }
    
    if (filters?.onSale) {
      products = products.filter(p => p.isOnSale);
    }

    return {
      success: true,
      data: products
    };
  }

  async getProduct(id: number): Promise<{ success: boolean; data?: Product }> {
    await this.delay();
    
    const product = mockProducts.find(p => p.id === id);
    
    if (product) {
      return {
        success: true,
        data: product
      };
    }
    
    return {
      success: false
    };
  }

  async getCategories(): Promise<{ success: boolean; data: Category[] }> {
    await this.delay();
    
    return {
      success: true,
      data: mockCategories
    };
  }

  async getCollections(): Promise<{ success: boolean; data: Collection[] }> {
    await this.delay();
    
    return {
      success: true,
      data: mockCollections
    };
  }

  async searchProducts(query: string): Promise<{ success: boolean; data: Product[] }> {
    await this.delay();
    
    const results = mockProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      success: true,
      data: results
    };
  }
}

export const mockDataService = new MockDataService();
export default mockDataService;
