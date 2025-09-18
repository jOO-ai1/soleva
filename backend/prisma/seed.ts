import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@solevaeg.com' },
    update: {},
    create: {
      email: 'admin@solevaeg.com',
      password: hashedPassword,
      name: 'Soleva Admin',
      role: 'ADMIN',
      isVerified: true,
      isActive: true
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create brand
  const brand = await prisma.brand.upsert({
    where: { slug: 'soleva' },
    update: {},
    create: {
      name: { ar: 'سوليفا', en: 'Soleva' },
      description: { ar: 'علامة تجارية للأحذية الفاخرة', en: 'Luxury footwear brand' },
      slug: 'soleva',
      isActive: true,
      sortOrder: 1
    }
  });

  console.log('✅ Created brand:', brand.name);

  // Create categories
  const menCategory = await prisma.category.upsert({
    where: { slug: 'mens-shoes' },
    update: {},
    create: {
      name: { ar: 'أحذية رجالي', en: 'Men\'s Shoes' },
      description: { ar: 'مجموعة أحذية رجالية فاخرة', en: 'Luxury men\'s footwear collection' },
      slug: 'mens-shoes',
      isActive: true,
      sortOrder: 1
    }
  });

  const womenCategory = await prisma.category.upsert({
    where: { slug: 'womens-shoes' },
    update: {},
    create: {
      name: { ar: 'أحذية نسائية', en: 'Women\'s Shoes' },
      description: { ar: 'مجموعة أحذية نسائية فاخرة', en: 'Luxury women\'s footwear collection' },
      slug: 'womens-shoes',
      isActive: true,
      sortOrder: 2
    }
  });

  console.log('✅ Created categories');

  // Create collection
  const collection = await prisma.collection.upsert({
    where: { slug: 'spring-2024' },
    update: {},
    create: {
      name: { ar: 'كولكشن ربيع ٢٠٢٤', en: 'Spring 2024 Collection' },
      description: { ar: 'أحدث تشكيلة لربيع ٢٠٢٤', en: 'Latest Spring 2024 collection' },
      slug: 'spring-2024',
      isActive: true,
      isFeatured: true,
      sortOrder: 1
    }
  });

  console.log('✅ Created collection');

  // Create sample products
  const product1 = await prisma.product.create({
    data: {
      name: { ar: 'حذاء سوليفا كلاسيك', en: 'Soleva Classic Shoe' },
      description: {
        ar: 'حذاء كلاسيك أنيق من الجلد الطبيعي',
        en: 'Elegant classic shoe made from genuine leather'
      },
      sku: 'SOL-CLASSIC-001',
      basePrice: 299.99,
      stockQuantity: 50,
      images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400'],

      slug: 'soleva-classic-shoe',
      status: 'ACTIVE',
      isActive: true,
      isFeatured: true,
      brandId: brand.id,
      categoryId: menCategory.id,
      collectionId: collection.id
    }
  });

  const product2 = await prisma.product.create({
    data: {
      name: { ar: 'حذاء سوليفا الرياضي', en: 'Soleva Sport Shoe' },
      description: {
        ar: 'حذاء رياضي مريح للاستخدام اليومي',
        en: 'Comfortable sport shoe for daily use'
      },
      sku: 'SOL-SPORT-001',
      basePrice: 199.99,
      stockQuantity: 30,
      images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400'],

      slug: 'soleva-sport-shoe',
      status: 'ACTIVE',
      isActive: true,
      isFeatured: false,
      brandId: brand.id,
      categoryId: menCategory.id,
      collectionId: collection.id
    }
  });

  console.log('✅ Created sample products');

  // Create product variants
  await prisma.productVariant.create({
    data: {
      productId: product1.id,
      color: { ar: 'بني', en: 'Brown', code: '#8B4513' },
      size: '42',
      sku: 'SOL-CLASSIC-001-BR-42',
      stockQuantity: 10
    }
  });

  await prisma.productVariant.create({
    data: {
      productId: product1.id,
      color: { ar: 'أسود', en: 'Black', code: '#000000' },
      size: '43',
      sku: 'SOL-CLASSIC-001-BL-43',
      stockQuantity: 15
    }
  });

  console.log('✅ Created product variants');

  // Create Egyptian governorates for shipping
  const cairo = await prisma.governorate.create({
    data: {
      name: { ar: 'القاهرة', en: 'Cairo' },
      code: 'CAI',
      shippingCost: 30.00
    }
  });

  const giza = await prisma.governorate.create({
    data: {
      name: { ar: 'الجيزة', en: 'Giza' },
      code: 'GIZ',
      shippingCost: 35.00
    }
  });

  const alexandria = await prisma.governorate.create({
    data: {
      name: { ar: 'الإسكندرية', en: 'Alexandria' },
      code: 'ALX',
      shippingCost: 50.00
    }
  });

  console.log('✅ Created governorates');

  // Create centers
  await prisma.centers.create({
    data: {
      governorateId: cairo.id,
      name: { ar: 'مركز القاهرة', en: 'Cairo Center' },
      code: 'CAI-CTR'
    }
  });

  await prisma.centers.create({
    data: {
      governorateId: giza.id,
      name: { ar: 'مركز الجيزة', en: 'Giza Center' },
      code: 'GIZ-CTR'
    }
  });

  console.log('✅ Created centers');

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: { ar: 'متجر سوليفا', en: 'Soleva Store' },
      storeDescription: { ar: 'متجر الأحذية الفاخرة', en: 'Luxury Footwear Store' },
      email: 'info@solevaeg.com',
      phone: '+20123456789',
      address: { ar: 'القاهرة، مصر', en: 'Cairo, Egypt' },
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      language: 'ar',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: ''
      }
    }
  });

  console.log('✅ Created store settings');

  // Create integration settings
  await prisma.integrationSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      paymentGateways: {
        paymob: { enabled: false, apiKey: '' },
        fawry: { enabled: false, apiKey: '' }
      },
      shippingProviders: {
        aramex: { enabled: false, apiKey: '' }
      },
      emailService: {
        provider: 'smtp',
        apiKey: '',
        fromEmail: 'info@solevaeg.com'
      },
      smsService: {
        provider: 'twilio',
        apiKey: '',
        fromNumber: ''
      },
      analytics: {
        googleAnalytics: '',
        facebookPixel: ''
      },
      socialLogin: {
        google: { enabled: false, clientId: '' },
        facebook: { enabled: false, appId: '' }
      }
    }
  });

  console.log('✅ Created integration settings');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('📊 Created:');
  console.log('  - 1 Admin user');
  console.log('  - 1 Brand');
  console.log('  - 2 Categories');
  console.log('  - 1 Collection');
  console.log('  - 2 Products');
  console.log('  - 2 Product variants');
  console.log('  - 3 Governorates');
  console.log('  - 2 Centers');
  console.log('  - Store settings');
  console.log('  - Integration settings');
}

main().
catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
}).
finally(async () => {
  await prisma.$disconnect();
});