// Get all product collections
function collections() {
  return [
  {
    id: '1',
    name: { en: 'New Arrivals', ar: 'وصل حديثاً' },
    description: {
      en: 'Latest collection of premium footwear',
      ar: 'أحدث مجموعة من الأحذية الفاخرة'
    },
    slug: 'new-arrivals',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    featured: true
  },
  {
    id: '2',
    name: { en: 'Best Sellers', ar: 'الأكثر مبيعاً' },
    description: {
      en: 'Our most popular shoes loved by customers',
      ar: 'أشهر أحذيتنا المحبوبة من العملاء'
    },
    slug: 'best-sellers',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
    featured: true
  },
  {
    id: '3',
    name: { en: 'Limited Edition', ar: 'إصدار محدود' },
    description: {
      en: 'Exclusive limited edition designs',
      ar: 'تصاميم حصرية بإصدار محدود'
    },
    slug: 'limited-edition',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600',
    featured: false
  }];

}