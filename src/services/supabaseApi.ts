import { supabase } from './supabase';

// Supabase API handlers with proper error handling
export const supabaseProductsApi = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; collection?: string }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `);

      // Apply filters
      if (params?.search) {
        query = query.or(`name->en.ilike.%${params.search}%,name->ar.ilike.%${params.search}%`);
      }

      if (params?.collection) {
        query = query.eq('collections.slug', params.collection);
      }

      // Apply pagination
      if (params?.page && params?.per_page) {
        const from = (params.page - 1) * params.per_page;
        const to = from + params.per_page - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = (data || []).map((item: any) => ({
        id: item.id.toString(),
        slug: item.slug,
        name: item.name,
        description: item.description,
        images: item.images,
        basePrice: item.base_price,
        salePrice: item.sale_price,
        isFeatured: item.is_featured,
        category: item.category,
        collection: item.collection,
      }));

      return {
        data: transformedData,
        status: 200,
        success: true,
        message: 'Products fetched successfully'
      };
    } catch (error) {
      console.error('Supabase products API error:', error);
      throw {
        message: 'Failed to fetch products',
        status: 500
      };
    }
  },

  async getById(id: number) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = {
        id: data.id.toString(),
        slug: data.slug,
        name: data.name,
        description: data.description,
        images: data.images,
        basePrice: data.base_price,
        salePrice: data.sale_price,
        isFeatured: data.is_featured,
        category: data.category,
        collection: data.collection,
      };

      return {
        data: transformedData,
        status: 200,
        success: true,
        message: 'Product fetched successfully'
      };
    } catch (error) {
      console.error('Supabase product API error:', error);
      throw {
        message: 'Failed to fetch product',
        status: 500
      };
    }
  }
};

export const supabaseCategoriesApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;

      return {
        data: data || [],
        status: 200,
        success: true,
        message: 'Categories fetched successfully'
      };
    } catch (error) {
      console.error('Supabase categories API error:', error);
      throw {
        message: 'Failed to fetch categories',
        status: 500
      };
    }
  }
};

export const supabaseCollectionsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*');

      if (error) throw error;

      return {
        data: data || [],
        status: 200,
        success: true,
        message: 'Collections fetched successfully'
      };
    } catch (error) {
      console.error('Supabase collections API error:', error);
      throw {
        message: 'Failed to fetch collections',
        status: 500
      };
    }
  }
};
