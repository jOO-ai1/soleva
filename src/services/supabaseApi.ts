import { supabase, Product, Category, Collection } from './supabase';
import { ApiResponse, ApiError } from './api';

// Helper function to transform Supabase data to API format
function transformProduct(product: any): any {
  return {
    id: product.id.toString(),
    slug: product.slug,
    name: product.name,
    description: product.description,
    images: product.images || ['/api/placeholder/300/300'],
    basePrice: product.base_price,
    salePrice: product.sale_price,
    isFeatured: product.is_featured,
    category: product.category ? {
      slug: product.category.slug
    } : null,
    collection: product.collection ? {
      slug: product.collection.slug
    } : null
  };
}

export const supabaseProductsApi = {
  async getAll(params?: any): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase.
      from('products').
      select(`
          *,
          category:categories(*),
          collection:collections(*)
        `);

      if (params?.search) {
        query = query.or(`name->>en.ilike.%${params.search}%,name->>ar.ilike.%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase error:', error);
        // Return mock data if tables don't exist yet
        return {
          data: getMockProducts(),
          status: 200,
          success: true
        };
      }

      const transformedProducts = (data || []).map(transformProduct);

      return {
        data: transformedProducts,
        status: 200,
        success: true
      };
    } catch (error: any) {
      console.warn('API error:', error);
      // Return mock data as fallback
      return {
        data: getMockProducts(),
        status: 200,
        success: true
      };
    }
  },

  async getById(id: number): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.
      from('products').
      select(`
          *,
          category:categories(*),
          collection:collections(*)
        `).
      eq('id', id).
      single();

      if (error) {
        throw {
          message: error.message,
          status: 404
        } as ApiError;
      }

      return {
        data: transformProduct(data),
        status: 200,
        success: true
      };
    } catch (error: any) {
      throw {
        message: 'Product not found',
        status: 404
      } as ApiError;
    }
  }
};

export const supabaseCategoriesApi = {
  async getAll(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase.
      from('categories').
      select('*');

      if (error) {
        throw {
          message: error.message,
          status: 500
        } as ApiError;
      }

      return {
        data: data || [],
        status: 200,
        success: true
      };
    } catch (error: any) {
      return {
        data: [],
        status: 200,
        success: true
      };
    }
  }
};

export const supabaseCollectionsApi = {
  async getAll(): Promise<ApiResponse<Collection[]>> {
    try {
      const { data, error } = await supabase.
      from('collections').
      select('*');

      if (error) {
        console.warn('Supabase collections error:', error);
        return {
          data: [],
          status: 200,
          success: true
        };
      }

      return {
        data: data || [],
        status: 200,
        success: true
      };
    } catch (error: any) {
      console.warn('Collections API error:', error);
      return {
        data: [],
        status: 200,
        success: true
      };
    }
  }
};

// Mock data for development when database is not yet set up
function getMockProducts() {
  return [
  {
    id: "1",
    slug: "classic-leather-shoe-brown",
    name: { en: "Classic Leather Shoe - Brown", ar: "حذاء جلدي كلاسيكي - بني" },
    description: { en: "Premium brown leather shoe with classic design", ar: "حذاء جلدي بني فاخر بتصميم كلاسيكي" },
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop"],
    basePrice: 1200,
    salePrice: 999,
    isFeatured: true,
    category: { slug: "mens-shoes" },
    collection: { slug: "premium" }
  },
  {
    id: "2",
    slug: "modern-sneaker-white",
    name: { en: "Modern Sneaker - White", ar: "حذاء رياضي عصري - أبيض" },
    description: { en: "Contemporary white sneaker with modern comfort", ar: "حذاء رياضي أبيض عصري براحة حديثة" },
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop"],
    basePrice: 800,
    salePrice: null,
    isFeatured: true,
    category: { slug: "mens-shoes" },
    collection: { slug: "essentials" }
  },
  {
    id: "3",
    slug: "elegant-heel-black",
    name: { en: "Elegant Heel - Black", ar: "كعب أنيق - أسود" },
    description: { en: "Sophisticated black heel for special occasions", ar: "كعب أسود أنيق للمناسبات الخاصة" },
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop"],
    basePrice: 1500,
    salePrice: 1299,
    isFeatured: true,
    category: { slug: "womens-shoes" },
    collection: { slug: "premium" }
  },
  {
    id: "4",
    slug: "casual-loafer-tan",
    name: { en: "Casual Loafer - Tan", ar: "حذاء كاجوال - تان" },
    description: { en: "Comfortable tan loafer for everyday wear", ar: "حذاء كاجوال تان مريح للارتداء اليومي" },
    images: ["https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=300&fit=crop"],
    basePrice: 950,
    salePrice: null,
    isFeatured: false,
    category: { slug: "mens-shoes" },
    collection: { slug: "essentials" }
  },
  {
    id: "5",
    slug: "summer-sandal-beige",
    name: { en: "Summer Sandal - Beige", ar: "صندل صيفي - بيج" },
    description: { en: "Light beige sandal perfect for summer", ar: "صندل بيج خفيف مثالي للصيف" },
    images: ["https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop"],
    basePrice: 650,
    salePrice: 549,
    isFeatured: false,
    category: { slug: "womens-shoes" },
    collection: { slug: "essentials" }
  },
  {
    id: "6",
    slug: "business-oxford-black",
    name: { en: "Business Oxford - Black", ar: "حذاء أوكسفورد أعمال - أسود" },
    description: { en: "Professional black Oxford shoe for business", ar: "حذاء أوكسفورد أسود مهني للأعمال" },
    images: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop"],
    basePrice: 1400,
    salePrice: null,
    isFeatured: true,
    category: { slug: "mens-shoes" },
    collection: { slug: "premium" }
  }];

}