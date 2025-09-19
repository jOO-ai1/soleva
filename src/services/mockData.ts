// Mock data for fallback use
export const getMockProducts = () => [
  {
    id: '1',
    name: { en: 'Classic Oxford Shoes', ar: 'حذاء أكسفورد كلاسيكي' },
    description: { en: 'Premium leather Oxford shoes perfect for formal occasions', ar: 'حذاء أكسفورد من الجلد الفاخر مثالي للمناسبات الرسمية' },
    price: 1200,
    originalPrice: 1500,
    images: [
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'
    ],
    category: {
      id: '1',
      name: { en: "Men's Shoes", ar: 'أحذية رجالي' },
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
    featured: true,
    isFeatured: true,
    slug: 'classic-oxford-shoes'
  },
  {
    id: '2',
    name: { en: 'Elegant High Heels', ar: 'كعب عالي أنيق' },
    description: { en: 'Stylish high heel shoes for special occasions', ar: 'حذاء بكعب عالي أنيق للمناسبات الخاصة' },
    price: 800,
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'],
    category: {
      id: '2',
      name: { en: "Women's Shoes", ar: 'أحذية حريمي' },
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
    featured: false,
    isFeatured: false,
    slug: 'elegant-high-heels'
  },
  {
    id: '3',
    name: { en: 'Running Sneakers', ar: 'حذاء جري رياضي' },
    description: { en: 'Comfortable running shoes with advanced cushioning', ar: 'حذاء جري مريح مع وسائد متطورة' },
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
    featured: true,
    isFeatured: true,
    slug: 'running-sneakers'
  },
  {
    id: '4',
    name: { en: 'Casual Loafers', ar: 'حذاء كاجوال بدون رباط' },
    description: { en: 'Comfortable casual loafers for everyday wear', ar: 'حذاء كاجوال مريح للاستخدام اليومي' },
    price: 600,
    images: ['https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600'],
    category: {
      id: '1',
      name: { en: "Men's Shoes", ar: 'أحذية رجالي' },
      slug: 'mens-shoes'
    },
    sizes: [40, 41, 42, 43, 44],
    colors: ['Brown', 'Black', 'Tan'],
    rating: 4.4,
    reviewCount: 15,
    inStock: true,
    featured: false,
    isFeatured: false,
    slug: 'casual-loafers'
  },
  {
    id: '5',
    name: { en: 'Ballet Flats', ar: 'حذاء باليه مسطح' },
    description: { en: 'Elegant ballet flats for comfort and style', ar: 'حذاء باليه مسطح أنيق للراحة والأناقة' },
    price: 400,
    images: ['https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=600'],
    category: {
      id: '2',
      name: { en: "Women's Shoes", ar: 'أحذية حريمي' },
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
    featured: false,
    isFeatured: false,
    slug: 'ballet-flats'
  }
];

export const getMockCategories = () => [
  {
    id: '1',
    name: { en: "Men's Shoes", ar: "أحذية رجالي" },
    description: { en: "Premium men's footwear collection", ar: "مجموعة أحذية رجالي فاخرة" },
    slug: 'mens-shoes',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
    parentId: null,
    parentName: null,
    isActive: true,
    sortOrder: 1,
    productsCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: { en: "Women's Shoes", ar: "أحذية حريمي" },
    description: { en: "Elegant women's footwear collection", ar: "مجموعة أحذية حريمي أنيقة" },
    slug: 'womens-shoes',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    parentId: null,
    parentName: null,
    isActive: true,
    sortOrder: 2,
    productsCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: { en: "Sports Shoes", ar: "أحذية رياضية" },
    description: { en: "Athletic and sports footwear", ar: "أحذية رياضية ولياقة" },
    slug: 'sports-shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    parentId: null,
    parentName: null,
    isActive: true,
    sortOrder: 3,
    productsCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getMockCollections = () => [
  {
    id: '1',
    name: { en: 'New Arrivals', ar: 'وصل حديثاً' },
    description: { en: 'Latest collection of premium footwear', ar: 'أحدث مجموعة من الأحذية الفاخرة' },
    slug: 'new-arrivals',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    startDate: null,
    endDate: null,
    productsCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: { en: 'Best Sellers', ar: 'الأكثر مبيعاً' },
    description: { en: 'Our most popular shoes loved by customers', ar: 'أشهر أحذيتنا المحبوبة من العملاء' },
    slug: 'best-sellers',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    startDate: null,
    endDate: null,
    productsCount: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: { en: 'Limited Edition', ar: 'إصدار محدود' },
    description: { en: 'Exclusive limited edition designs', ar: 'تصاميم حصرية بإصدار محدود' },
    slug: 'limited-edition',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600',
    isActive: true,
    isFeatured: false,
    sortOrder: 3,
    startDate: null,
    endDate: null,
    productsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
