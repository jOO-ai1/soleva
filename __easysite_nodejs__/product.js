
function getProduct(id) {
    // Mock data for individual product
    const mockProducts = [
        {
            id: "1",
            name: { en: "Classic Leather Sneakers", ar: "أحذية رياضية جلدية كلاسيكية" },
            description: { en: "Premium leather sneakers with comfortable sole", ar: "أحذية رياضية جلدية فاخرة مع نعل مريح" },
            price: 299.99,
            discountedPrice: 249.99,
            images: [
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop"
            ],
            sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44],
            colors: ["black", "white", "brown"],
            category: { id: "1", name: { en: "Sneakers", ar: "أحذية رياضية" } },
            collection: { id: "1", name: { en: "Classic Collection", ar: "المجموعة الكلاسيكية" }, slug: "classic" },
            inStock: true,
            featured: true,
            rating: 4.5,
            reviewCount: 128
        },
        {
            id: "2",
            name: { en: "Modern Athletic Shoes", ar: "أحذية رياضية حديثة" },
            description: { en: "Lightweight athletic shoes for daily wear", ar: "أحذية رياضية خفيفة للارتداء اليومي" },
            price: 199.99,
            images: [
                "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop"
            ],
            sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44],
            colors: ["blue", "red", "gray"],
            category: { id: "1", name: { en: "Sneakers", ar: "أحذية رياضية" } },
            collection: { id: "2", name: { en: "Sport Collection", ar: "المجموعة الرياضية" }, slug: "sport" },
            inStock: true,
            featured: false,
            rating: 4.3,
            reviewCount: 89
        }
    ];

    const product = mockProducts.find(p => p.id === id.toString());
    
    if (!product) {
        throw new Error('Product not found');
    }

    return product;
}
