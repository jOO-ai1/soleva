function products(params = {}) {
    // Mock products data with enhanced features
    const mockProducts = [
        {
            id: '1',
            name: {
                en: 'Classic Leather Sneakers',
                ar: 'حذاء رياضي جلدي كلاسيكي'
            },
            description: {
                en: 'Premium leather sneakers with comfortable cushioning and classic design.',
                ar: 'حذاء رياضي من الجلد الفاخر مع وسادة مريحة وتصميم كلاسيكي.'
            },
            basePrice: 159.99,
            salePrice: 129.99,
            price: 129.99,
            originalPrice: 159.99,
            discount: 19,
            slug: 'classic-leather-sneakers',
            images: [
                'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
                'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400'
            ],
            sizes: [38, 39, 40, 41, 42, 43, 44],
            colors: ['Black', 'White', 'Brown'],
            category: {
                id: '1',
                name: { en: 'Sneakers', ar: 'أحذية رياضية' },
                slug: 'sneakers'
            },
            collection: {
                id: '1',
                name: { en: 'Classic Collection', ar: 'المجموعة الكلاسيكية' },
                slug: 'classic'
            },
            isNew: false,
            isFeatured: true,
            inStock: true,
            stockCount: 15
        },
        {
            id: '2',
            name: {
                en: 'Running Shoes Pro',
                ar: 'حذاء الجري المحترف'
            },
            description: {
                en: 'High-performance running shoes with advanced cushioning technology.',
                ar: 'حذاء جري عالي الأداء بتقنية وسادة متقدمة.'
            },
            basePrice: 189.99,
            price: 189.99,
            slug: 'running-shoes-pro',
            images: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400'
            ],
            sizes: [38, 39, 40, 41, 42, 43, 44, 45],
            colors: ['Blue', 'Red', 'Black'],
            category: {
                id: '2',
                name: { en: 'Running', ar: 'الجري' },
                slug: 'running'
            },
            collection: {
                id: '2',
                name: { en: 'Sport Collection', ar: 'المجموعة الرياضية' },
                slug: 'sport'
            },
            isNew: true,
            isFeatured: true,
            inStock: true,
            stockCount: 8
        },
        {
            id: '3',
            name: {
                en: 'Casual Loafers',
                ar: 'حذاء كاجوال'
            },
            description: {
                en: 'Comfortable casual loafers perfect for everyday wear.',
                ar: 'حذاء كاجوال مريح مثالي للاستخدام اليومي.'
            },
            basePrice: 99.99,
            salePrice: 79.99,
            price: 79.99,
            originalPrice: 99.99,
            discount: 20,
            slug: 'casual-loafers',
            images: [
                'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=400'
            ],
            sizes: [39, 40, 41, 42, 43],
            colors: ['Brown', 'Black', 'Tan'],
            category: {
                id: '3',
                name: { en: 'Casual', ar: 'كاجوال' },
                slug: 'casual'
            },
            inStock: true,
            stockCount: 12
        },
        {
            id: '4',
            name: {
                en: 'Formal Oxford Shoes',
                ar: 'حذاء أوكسفورد رسمي'
            },
            description: {
                en: 'Elegant Oxford shoes for formal occasions and business wear.',
                ar: 'حذاء أوكسفورد أنيق للمناسبات الرسمية والعمل.'
            },
            basePrice: 199.99,
            price: 199.99,
            slug: 'formal-oxford-shoes',
            images: [
                'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400'
            ],
            sizes: [38, 39, 40, 41, 42, 43, 44],
            colors: ['Black', 'Brown'],
            category: {
                id: '4',
                name: { en: 'Formal', ar: 'رسمي' },
                slug: 'formal'
            },
            collection: {
                id: '3',
                name: { en: 'Business Collection', ar: 'مجموعة الأعمال' },
                slug: 'business'
            },
            inStock: true,
            stockCount: 5
        },
        {
            id: '5',
            name: {
                en: 'Summer Sandals',
                ar: 'صندل صيفي'
            },
            description: {
                en: 'Comfortable summer sandals with adjustable straps.',
                ar: 'صندل صيفي مريح بأحزمة قابلة للتعديل.'
            },
            basePrice: 49.99,
            price: 49.99,
            slug: 'summer-sandals',
            images: [
                'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400'
            ],
            sizes: [38, 39, 40, 41, 42, 43],
            colors: ['Brown', 'Black', 'Tan'],
            category: {
                id: '5',
                name: { en: 'Sandals', ar: 'صنادل' },
                slug: 'sandals'
            },
            isNew: true,
            inStock: true,
            stockCount: 20
        }
    ];

    // Apply filters if provided
    let filteredProducts = [...mockProducts];

    if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.en.toLowerCase().includes(searchTerm) ||
            product.name.ar.toLowerCase().includes(searchTerm) ||
            product.description.en.toLowerCase().includes(searchTerm) ||
            product.description.ar.toLowerCase().includes(searchTerm)
        );
    }

    if (params.collection) {
        filteredProducts = filteredProducts.filter(product => 
            product.collection?.slug === params.collection
        );
    }

    if (params.category) {
        filteredProducts = filteredProducts.filter(product => 
            product.category?.slug === params.category
        );
    }

    // Pagination
    const page = parseInt(params.page || 1);
    const perPage = parseInt(params.per_page || 10);
    const startIndex = (page - 1) * perPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + perPage);

    return {
        data: paginatedProducts,
        total: filteredProducts.length,
        page: page,
        per_page: perPage,
        total_pages: Math.ceil(filteredProducts.length / perPage)
    };
}
