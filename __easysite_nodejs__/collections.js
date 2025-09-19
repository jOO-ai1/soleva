
function getAllCollections() {
    return [
        {
            id: "1",
            name: { en: "Classic Collection", ar: "المجموعة الكلاسيكية" },
            slug: "classic",
            description: { en: "Timeless designs that never go out of style", ar: "تصاميم أبدية لا تخرج من الموضة أبداً" },
            image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop",
            productCount: 24,
            featured: true
        },
        {
            id: "2",
            name: { en: "Sport Collection", ar: "المجموعة الرياضية" },
            slug: "sport",
            description: { en: "Athletic footwear for active lifestyles", ar: "أحذية رياضية لأنماط الحياة النشطة" },
            image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=400&fit=crop",
            productCount: 31,
            featured: true
        },
        {
            id: "3",
            name: { en: "Luxury Collection", ar: "المجموعة الفاخرة" },
            slug: "luxury",
            description: { en: "Premium materials and exceptional craftsmanship", ar: "مواد فاخرة وحرفية استثنائية" },
            image: "https://images.unsplash.com/photo-1608256246200-53e8b47b5788?w=600&h=400&fit=crop",
            productCount: 18,
            featured: false
        }
    ];
}
