// Categories API function
function getCategories() {
  return [
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
  }];

}

export default getCategories();