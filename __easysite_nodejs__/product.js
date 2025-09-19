// Get a single product by ID
function product(id) {
  const allProducts = [
    {
      id: '1',
      name: { en: 'Classic Oxford Shoes', ar: 'حذاء أكسفورد كلاسيكي' },
      description: { 
        en: 'Premium leather Oxford shoes perfect for formal occasions',
        ar: 'حذاء أكسفورد من الجلد الفاخر مثالي للمناسبات الرسمية'
      },
      price: 1200,
      originalPrice: 1500,
      images: [
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'
      ],
      category: {
        id: '1',
        name: { en: 'Men\'s Shoes', ar: 'أحذية رجالي' },
        slug: 'mens-shoes'
      },
      collection: {
        id: '2',
        name: { en: 'Best Sellers', ar: 'الأكثر مبيعاً' },
        slug: 'best-sellers'
      },
      sizes: [40, 41, 42, 43, 44, 45],
      colors: ['Black', 'Brown', 'Dark Brown'],
      rating: 4.8,
      reviewCount: 24,
      inStock: true,
      featured: true
    },
    {
      id: '2',
      name: { en: 'Elegant High Heels', ar: 'كعب عالي أنيق' },
      description: { 
        en: 'Stylish high heel shoes for special occasions',
        ar: 'حذاء بكعب عالي أنيق للمناسبات الخاصة'
      },
      price: 800,
      images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'],
      category: {
        id: '2',
        name: { en: 'Women\'s Shoes', ar: 'أحذية حريمي' },
        slug: 'womens-shoes'
      },
      collection: {
        id: '1',
        name: { en: 'New Arrivals', ar: 'وصل حديثاً' },
        slug: 'new-arrivals'
      },
      sizes: [35, 36, 37, 38, 39, 40],
      colors: ['Black', 'Red', 'Nude'],
      rating: 4.6,
      reviewCount: 18,
      inStock: true,
      featured: false
    },
    {
      id: '3',
      name: { en: 'Running Sneakers', ar: 'حذاء جري رياضي' },
      description: { 
        en: 'Comfortable running shoes with advanced cushioning',
        ar: 'حذاء جري مريح مع وسائد متطورة'
      },
      price: 950,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      category: {
        id: '3',
        name: { en: 'Sports Shoes', ar: 'أحذية رياضية' },
        slug: 'sports-shoes'
      },
      collection: {
        id: '1',
        name: { en: 'New Arrivals', ar: 'وصل حديثاً' },
        slug: 'new-arrivals'
      },
      sizes: [38, 39, 40, 41, 42, 43, 44],
      colors: ['White', 'Black', 'Blue', 'Red'],
      rating: 4.7,
      reviewCount: 32,
      inStock: true,
      featured: true
    },
    {
      id: '4',
      name: { en: 'Casual Loafers', ar: 'حذاء كاجوال بدون رباط' },
      description: { 
        en: 'Comfortable casual loafers for everyday wear',
        ar: 'حذاء كاجوال مريح للاستخدام اليومي'
      },
      price: 600,
      images: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600'],
      category: {
        id: '1',
        name: { en: 'Men\'s Shoes', ar: 'أحذية رجالي' },
        slug: 'mens-shoes'
      },
      sizes: [40, 41, 42, 43, 44],
      colors: ['Brown', 'Black', 'Tan'],
      rating: 4.4,
      reviewCount: 15,
      inStock: true,
      featured: false
    },
    {
      id: '5',
      name: { en: 'Ballet Flats', ar: 'حذاء باليه مسطح' },
      description: { 
        en: 'Elegant ballet flats for comfort and style',
        ar: 'حذاء باليه مسطح أنيق للراحة والأناقة'
      },
      price: 400,
      images: ['https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=600'],
      category: {
        id: '2',
        name: { en: 'Women\'s Shoes', ar: 'أحذية حريمي' },
        slug: 'womens-shoes'
      },
      collection: {
        id: '2',
        name: { en: 'Best Sellers', ar: 'الأكثر مبيعاً' },
        slug: 'best-sellers'
      },
      sizes: [35, 36, 37, 38, 39, 40],
      colors: ['Black', 'Brown', 'Pink', 'Beige'],
      rating: 4.5,
      reviewCount: 22,
      inStock: true,
      featured: false
    }
  ];

  const foundProduct = allProducts.find(p => p.id === id.toString());
  
  if (!foundProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }

  return foundProduct;
}