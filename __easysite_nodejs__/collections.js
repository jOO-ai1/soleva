// Collections API function
function getCollections() {
  return [
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
  }];

}

