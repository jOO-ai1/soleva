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
        console.warn('Supabase error, using mock data:', error);
        // Return mock data if tables don't exist yet
        const { getMockProducts } = await import('./mockData');
        return {
          data: getMockProducts(),
          status: 200,
          success: true,
          message: 'Using offline data - database not available'
        };
      }

      const transformedProducts = (data || []).map(transformProduct);

      return {
        data: transformedProducts,
        status: 200,
        success: true
      };
    } catch (error: any) {
      console.warn('API error, using mock data:', error);
      // Return mock data as fallback
      const { getMockProducts } = await import('./mockData');
      return {
        data: getMockProducts(),
        status: 200,
        success: true,
        message: 'Using offline data - connection failed'
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

