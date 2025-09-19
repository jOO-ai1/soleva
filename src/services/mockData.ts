// Mock data for development and fallback scenarios
export function getMockProducts() {
  return [
    {
      id: "1",
      slug: "classic-leather-shoe-brown",
      name: { en: "Classic Leather Shoe - Brown", ar: "حذاء جلدي كلاسيكي - بني" },
      description: { en: "Premium brown leather shoe with classic design", ar: "حذاء جلدي بني فاخر بتصميم كلاسيكي" },
      images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop"],
      basePrice: 1200,
      salePrice: 999,
      isFeatured: true,
      category: { slug: "mens-shoes" },
      collection: { slug: "premium" }
    },
    {
      id: "2",
      slug: "modern-sneaker-white",
      name: { en: "Modern Sneaker - White", ar: "حذاء رياضي عصري - أبيض" },
      description: { en: "Contemporary white sneaker with modern comfort", ar: "حذاء رياضي أبيض عصري براحة حديثة" },
      images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop"],
      basePrice: 800,
      salePrice: null,
      isFeatured: true,
      category: { slug: "mens-shoes" },
      collection: { slug: "essentials" }
    },
    {
      id: "3",
      slug: "elegant-heel-black",
      name: { en: "Elegant Heel - Black", ar: "كعب أنيق - أسود" },
      description: { en: "Sophisticated black heel for special occasions", ar: "كعب أسود أنيق للمناسبات الخاصة" },
      images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop"],
      basePrice: 1500,
      salePrice: 1299,
      isFeatured: true,
      category: { slug: "womens-shoes" },
      collection: { slug: "premium" }
    },
    {
      id: "4",
      slug: "casual-loafer-tan",
      name: { en: "Casual Loafer - Tan", ar: "حذاء كاجوال - تان" },
      description: { en: "Comfortable tan loafer for everyday wear", ar: "حذاء كاجوال تان مريح للارتداء اليومي" },
      images: ["https://images.unsplash.com/photo-1582897085656-c636d006a246?w=300&h=300&fit=crop"],
      basePrice: 950,
      salePrice: null,
      isFeatured: false,
      category: { slug: "mens-shoes" },
      collection: { slug: "essentials" }
    },
    {
      id: "5",
      slug: "summer-sandal-beige",
      name: { en: "Summer Sandal - Beige", ar: "صندل صيفي - بيج" },
      description: { en: "Light beige sandal perfect for summer", ar: "صندل بيج خفيف مثالي للصيف" },
      images: ["https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&h=300&fit=crop"],
      basePrice: 650,
      salePrice: 549,
      isFeatured: false,
      category: { slug: "womens-shoes" },
      collection: { slug: "essentials" }
    },
    {
      id: "6",
      slug: "business-oxford-black",
      name: { en: "Business Oxford - Black", ar: "حذاء أوكسفورد أعمال - أسود" },
      description: { en: "Professional black Oxford shoe for business", ar: "حذاء أوكسفورد أسود مهني للأعمال" },
      images: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=300&fit=crop"],
      basePrice: 1400,
      salePrice: null,
      isFeatured: true,
      category: { slug: "mens-shoes" },
      collection: { slug: "premium" }
    }
  ];
}

export function getMockCategories() {
  return [
    {
      id: 1,
      slug: "mens-shoes",
      name: { en: "Men's Shoes", ar: "أحذية رجالي" },
      description: { en: "Premium footwear for men", ar: "أحذية فاخرة للرجال" }
    },
    {
      id: 2,
      slug: "womens-shoes",
      name: { en: "Women's Shoes", ar: "أحذية نسائي" },
      description: { en: "Premium footwear for women", ar: "أحذية فاخرة للنساء" }
    }
  ];
}

export function getMockCollections() {
  return [
    {
      id: 1,
      slug: "essentials",
      name: { en: "Essentials", ar: "أساسي" },
      description: { en: "Essential footwear collection", ar: "مجموعة الأحذية الأساسية" }
    },
    {
      id: 2,
      slug: "premium",
      name: { en: "Premium", ar: "بريميوم" },
      description: { en: "Premium collection", ar: "المجموعة المميزة" }
    }
  ];
}