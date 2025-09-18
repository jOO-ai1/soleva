import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwzoqywqbwprxlfjiyko.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3em9xeXdxYndwcnhsZmppeWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzQyMzgsImV4cCI6MjA3MzgxMDIzOH0.HWy94B1iSgsYBnQwU8g3wWdkvWuQatQE1AUjqcXb2xY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Category {
  id: number;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: number;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  images: string[];
  base_price: number;
  sale_price?: number;
  is_featured: boolean;
  category_id?: number;
  collection_id?: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  collection?: Collection;
}
