-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Collections table
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  images JSONB NOT NULL DEFAULT '[]',
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  is_featured BOOLEAN DEFAULT FALSE,
  category_id INTEGER REFERENCES categories(id),
  collection_id INTEGER REFERENCES collections(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO categories (slug, name, description) VALUES
  ('mens-shoes', '{"en": "Men''s Shoes", "ar": "أحذية رجالية"}', '{"en": "Stylish shoes for men", "ar": "أحذية أنيقة للرجال"}'),
  ('womens-shoes', '{"en": "Women''s Shoes", "ar": "أحذية نسائية"}', '{"en": "Elegant shoes for women", "ar": "أحذية أنيقة للنساء"}'),
  ('kids-shoes', '{"en": "Kids Shoes", "ar": "أحذية أطفال"}', '{"en": "Comfortable shoes for children", "ar": "أحذية مريحة للأطفال"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample collections
INSERT INTO collections (slug, name, description) VALUES
  ('premium', '{"en": "Premium Collection", "ar": "مجموعة بريميوم"}', '{"en": "Our finest quality shoes", "ar": "أجود أحذيتنا جودة"}'),
  ('essentials', '{"en": "Essential Collection", "ar": "مجموعة أساسية"}', '{"en": "Everyday comfortable shoes", "ar": "أحذية مريحة يومية"}'),
  ('limited', '{"en": "Limited Edition", "ar": "طبعة محدودة"}', '{"en": "Exclusive limited edition shoes", "ar": "أحذية طبعة محدودة حصرية"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (slug, name, description, images, base_price, sale_price, is_featured, category_id, collection_id) VALUES
  (
    'classic-leather-shoe-brown',
    '{"en": "Classic Leather Shoe - Brown", "ar": "حذاء جلدي كلاسيكي - بني"}',
    '{"en": "Premium brown leather shoe with classic design", "ar": "حذاء جلدي بني فاخر بتصميم كلاسيكي"}',
    '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop"]',
    1200.00,
    999.00,
    true,
    1,
    1
  ),
  (
    'modern-sneaker-white',
    '{"en": "Modern Sneaker - White", "ar": "حذاء رياضي عصري - أبيض"}',
    '{"en": "Contemporary white sneaker with modern comfort", "ar": "حذاء رياضي أبيض عصري براحة حديثة"}',
    '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop"]',
    800.00,
    NULL,
    true,
    1,
    2
  ),
  (
    'elegant-heel-black',
    '{"en": "Elegant Heel - Black", "ar": "كعب أنيق - أسود"}',
    '{"en": "Sophisticated black heel for special occasions", "ar": "كعب أسود أنيق للمناسبات الخاصة"}',
    '["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop"]',
    1500.00,
    1299.00,
    true,
    2,
    1
  ),
  (
    'casual-loafer-tan',
    '{"en": "Casual Loafer - Tan", "ar": "حذاء كاجوال - تان"}',
    '{"en": "Comfortable tan loafer for everyday wear", "ar": "حذاء كاجوال تان مريح للارتداء اليومي"}',
    '["https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=300&fit=crop"]',
    950.00,
    NULL,
    false,
    1,
    2
  ),
  (
    'summer-sandal-beige',
    '{"en": "Summer Sandal - Beige", "ar": "صندل صيفي - بيج"}',
    '{"en": "Light beige sandal perfect for summer", "ar": "صندل بيج خفيف مثالي للصيف"}',
    '["https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop"]',
    650.00,
    549.00,
    false,
    2,
    2
  ),
  (
    'business-oxford-black',
    '{"en": "Business Oxford - Black", "ar": "حذاء أوكسفورد أعمال - أسود"}',
    '{"en": "Professional black Oxford shoe for business", "ar": "حذاء أوكسفورد أسود مهني للأعمال"}',
    '["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop"]',
    1400.00,
    NULL,
    true,
    1,
    1
  )
ON CONFLICT (slug) DO NOTHING;