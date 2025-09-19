function collections() {
    const mockCollections = [
        {
            id: '1',
            name: { en: 'Classic Collection', ar: 'المجموعة الكلاسيكية' },
            slug: 'classic',
            description: {
                en: 'Timeless designs that never go out of style',
                ar: 'تصاميم خالدة لا تخرج عن الموضة أبداً'
            },
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
            productCount: 1
        },
        {
            id: '2',
            name: { en: 'Sport Collection', ar: 'المجموعة الرياضية' },
            slug: 'sport',
            description: {
                en: 'High-performance athletic footwear',
                ar: 'أحذية رياضية عالية الأداء'
            },
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            productCount: 1
        },
        {
            id: '3',
            name: { en: 'Business Collection', ar: 'مجموعة الأعمال' },
            slug: 'business',
            description: {
                en: 'Professional footwear for the workplace',
                ar: 'أحذية مهنية لمكان العمل'
            },
            image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400',
            productCount: 1
        }
    ];

    return mockCollections;
}
