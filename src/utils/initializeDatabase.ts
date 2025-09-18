import { supabase } from '../services/supabase';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Check if tables exist by trying to fetch from them
    const { data: categories, error: catError } = await supabase.
    from('categories').
    select('id').
    limit(1);

    if (catError && catError.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('Tables do not exist. Please run the SQL setup in Supabase dashboard.');
      return false;
    }

    // If we reach here, tables exist
    console.log('Database tables are available');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

export async function createSampleData() {
  try {
    console.log('Creating sample data...');

    // Create categories
    const { data: existingCategories } = await supabase.
    from('categories').
    select('id').
    limit(1);

    if (!existingCategories || existingCategories.length === 0) {
      await supabase.from('categories').insert([
      {
        slug: 'mens-shoes',
        name: { en: "Men's Shoes", ar: "أحذية رجالي" },
        description: { en: "Premium footwear for men", ar: "أحذية فاخرة للرجال" }
      },
      {
        slug: 'womens-shoes',
        name: { en: "Women's Shoes", ar: "أحذية نسائي" },
        description: { en: "Premium footwear for women", ar: "أحذية فاخرة للنساء" }
      }]
      );
    }

    // Create collections
    const { data: existingCollections } = await supabase.
    from('collections').
    select('id').
    limit(1);

    if (!existingCollections || existingCollections.length === 0) {
      await supabase.from('collections').insert([
      {
        slug: 'essentials',
        name: { en: "Essentials", ar: "أساسي" },
        description: { en: "Essential footwear collection", ar: "مجموعة الأحذية الأساسية" }
      },
      {
        slug: 'premium',
        name: { en: "Premium", ar: "بريميوم" },
        description: { en: "Premium collection", ar: "المجموعة المميزة" }
      }]
      );
    }

    // Create products
    const { data: existingProducts } = await supabase.
    from('products').
    select('id').
    limit(1);

    if (!existingProducts || existingProducts.length === 0) {
      // Get category and collection IDs
      const { data: categories } = await supabase.
      from('categories').
      select('id, slug');

      const { data: collections } = await supabase.
      from('collections').
      select('id, slug');

      const mensCategory = categories?.find((c) => c.slug === 'mens-shoes')?.id;
      const womensCategory = categories?.find((c) => c.slug === 'womens-shoes')?.id;
      const essentialsCollection = collections?.find((c) => c.slug === 'essentials')?.id;
      const premiumCollection = collections?.find((c) => c.slug === 'premium')?.id;

      await supabase.from('products').insert([
      {
        slug: 'classic-leather-shoe-brown',
        name: { en: "Classic Leather Shoe - Brown", ar: "حذاء جلدي كلاسيكي - بني" },
        description: { en: "Premium brown leather shoe with classic design", ar: "حذاء جلدي بني فاخر بتصميم كلاسيكي" },
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop'],
        base_price: 1200.00,
        sale_price: 999.00,
        is_featured: true,
        category_id: mensCategory,
        collection_id: premiumCollection
      },
      {
        slug: 'modern-sneaker-white',
        name: { en: "Modern Sneaker - White", ar: "حذاء رياضي عصري - أبيض" },
        description: { en: "Contemporary white sneaker with modern comfort", ar: "حذاء رياضي أبيض عصري براحة حديثة" },
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop'],
        base_price: 800.00,
        is_featured: true,
        category_id: mensCategory,
        collection_id: essentialsCollection
      },
      {
        slug: 'elegant-heel-black',
        name: { en: "Elegant Heel - Black", ar: "كعب أنيق - أسود" },
        description: { en: "Sophisticated black heel for special occasions", ar: "كعب أسود أنيق للمناسبات الخاصة" },
        images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop'],
        base_price: 1500.00,
        sale_price: 1299.00,
        is_featured: true,
        category_id: womensCategory,
        collection_id: premiumCollection
      },
      {
        slug: 'casual-loafer-tan',
        name: { en: "Casual Loafer - Tan", ar: "حذاء كاجوال - تان" },
        description: { en: "Comfortable tan loafer for everyday wear", ar: "حذاء كاجوال تان مريح للارتداء اليومي" },
        images: ['https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=300&fit=crop'],
        base_price: 950.00,
        is_featured: false,
        category_id: mensCategory,
        collection_id: essentialsCollection
      },
      {
        slug: 'summer-sandal-beige',
        name: { en: "Summer Sandal - Beige", ar: "صندل صيفي - بيج" },
        description: { en: "Light beige sandal perfect for summer", ar: "صندل بيج خفيف مثالي للصيف" },
        images: ['https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop'],
        base_price: 650.00,
        sale_price: 549.00,
        is_featured: false,
        category_id: womensCategory,
        collection_id: essentialsCollection
      },
      {
        slug: 'business-oxford-black',
        name: { en: "Business Oxford - Black", ar: "حذاء أوكسفورد أعمال - أسود" },
        description: { en: "Professional black Oxford shoe for business", ar: "حذاء أوكسفورد أسود مهني للأعمال" },
        images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop'],
        base_price: 1400.00,
        is_featured: true,
        category_id: mensCategory,
        collection_id: premiumCollection
      }]
      );
    }

    console.log('Sample data created successfully');
    return true;
  } catch (error) {
    console.error('Error creating sample data:', error);
    return false;
  }
}