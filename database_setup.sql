-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  is_featured BOOLEAN DEFAULT FALSE,
  category_id INTEGER REFERENCES public.categories(id),
  collection_id INTEGER REFERENCES public.collections(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read access on categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on collections" ON public.collections
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on products" ON public.products
  FOR SELECT USING (true);

-- Insert sample data
INSERT INTO public.categories (slug, name, description) VALUES
('mens-shoes', '{"en": "Men''s Shoes", "ar": "أحذية رجالي"}', '{"en": "Premium footwear for men", "ar": "أحذية فاخرة للرجال"}'),
('womens-shoes', '{"en": "Women''s Shoes", "ar": "أحذية نسائي"}', '{"en": "Premium footwear for women", "ar": "أحذية فاخرة للنساء"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.collections (slug, name, description) VALUES
('essentials', '{"en": "Essentials", "ar": "أساسي"}', '{"en": "Essential footwear collection", "ar": "مجموعة الأحذية الأساسية"}'),
('premium', '{"en": "Premium", "ar": "بريميوم"}', '{"en": "Premium collection", "ar": "المجموعة المميزة"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (slug, name, description, images, base_price, sale_price, is_featured, category_id, collection_id) VALUES
('classic-leather-shoe-brown', '{"en": "Classic Leather Shoe - Brown", "ar": "حذاء جلدي كلاسيكي - بني"}', '{"en": "Premium brown leather shoe with classic design", "ar": "حذاء جلدي بني فاخر بتصميم كلاسيكي"}', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop'], 1200.00, 999.00, true, 1, 2),
('modern-sneaker-white', '{"en": "Modern Sneaker - White", "ar": "حذاء رياضي عصري - أبيض"}', '{"en": "Contemporary white sneaker with modern comfort", "ar": "حذاء رياضي أبيض عصري براحة حديثة"}', ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop'], 800.00, NULL, true, 1, 1),
('elegant-heel-black', '{"en": "Elegant Heel - Black", "ar": "كعب أنيق - أسود"}', '{"en": "Sophisticated black heel for special occasions", "ar": "كعب أسود أنيق للمناسبات الخاصة"}', ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop'], 1500.00, 1299.00, true, 2, 2),
('casual-loafer-tan', '{"en": "Casual Loafer - Tan", "ar": "حذاء كاجوال - تان"}', '{"en": "Comfortable tan loafer for everyday wear", "ar": "حذاء كاجوال تان مريح للارتداء اليومي"}', ARRAY['https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=300&fit=crop'], 950.00, NULL, false, 1, 1),
('summer-sandal-beige', '{"en": "Summer Sandal - Beige", "ar": "صندل صيفي - بيج"}', '{"en": "Light beige sandal perfect for summer", "ar": "صندل بيج خفيف مثالي للصيف"}', ARRAY['https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop'], 650.00, 549.00, false, 2, 1),
('business-oxford-black', '{"en": "Business Oxford - Black", "ar": "حذاء أوكسفورد أعمال - أسود"}', '{"en": "Professional black Oxford shoe for business", "ar": "حذاء أوكسفورد أسود مهني للأعمال"}', ARRAY['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop'], 1400.00, NULL, true, 1, 2)
ON CONFLICT (slug) DO NOTHING;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
