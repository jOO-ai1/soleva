import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { auth, requireManager } from '../middleware/auth';

// Import ProductStatus from the generated client
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductStatus } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Secure all admin routes
router.use(auth, requireManager);

// Get dashboard stats
router.get('/dashboard/stats', async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    lowStockItems,
    monthlyOrders,
    monthlyRevenue,
    monthlyCustomers,
    lastMonthOrders,
    lastMonthRevenue,
    lastMonthCustomers,
    yearlyRevenue,
    activeFlashSales,
    activeCoupons,
    pendingOrders,
    recentOrders] =
    await Promise.all([
    // Total counts
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true }
    }),
    prisma.user.count({
      where: { role: 'CUSTOMER' }
    }),
    prisma.product.count({
      where: { stockQuantity: { lte: 5 } }
    }),

    // This month
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } }
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startOfMonth }
      }
    }),

    // Last month
    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: { totalAmount: true }
    }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    }),

    // Yearly revenue
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfYear } },
      _sum: { totalAmount: true }
    }),

    // Active promotions (temporarily disabled until schema is updated)
    0, // prisma.flashSale.count({
    //   where: { 
    //     isActive: true,
    //     startDate: { lte: now },
    //     endDate: { gte: now }
    //   }
    // }),
    0, // prisma.coupon.count({
    //   where: { 
    //     isActive: true,
    //     validFrom: { lte: now },
    //     OR: [
    //       { validTo: null },
    //       { validTo: { gte: now } }
    //     ]
    //   }
    // }),

    // Pending orders
    prisma.order.count({
      where: { orderStatus: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } }
    }),

    // Recent orders for timeline
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        items: {
          take: 1,
          include: { product: { select: { name: true } } }
        }
      }
    })]
    );

    // Calculate growth percentages
    const ordersGrowth = lastMonthOrders > 0 ?
    Math.round((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100) :
    0;

    const revenueGrowth = lastMonthRevenue._sum.totalAmount ?
    Math.round((Number(monthlyRevenue._sum.totalAmount) - Number(lastMonthRevenue._sum.totalAmount)) / Number(lastMonthRevenue._sum.totalAmount) * 100) :
    0;

    const customersGrowth = lastMonthCustomers > 0 ?
    Math.round((monthlyCustomers - lastMonthCustomers) / lastMonthCustomers * 100) :
    0;

    // Calculate AOV (Average Order Value)
    const aov = totalOrders > 0 ? Number(totalRevenue._sum.totalAmount) / totalOrders : 0;

    res.json({
      success: true,
      data: {
        // Main KPIs
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        totalCustomers,
        lowStockItems,
        aov: Math.round(aov * 100) / 100,

        // Growth metrics
        ordersGrowth,
        revenueGrowth,
        customersGrowth,

        // Monthly metrics
        monthlyOrders,
        monthlyRevenue: Number(monthlyRevenue._sum.totalAmount || 0),
        monthlyCustomers,

        // Yearly metrics
        yearlyRevenue: Number(yearlyRevenue._sum.totalAmount || 0),

        // Promotional metrics
        activeFlashSales,
        activeCoupons,

        // Operational metrics
        pendingOrders,

        // Recent activity
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.user.name,
          total: Number(order.totalAmount),
          status: order.orderStatus,
          createdAt: order.createdAt,
          firstItem: order.items[0]?.product?.name || 'N/A'
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Get recent orders
router.get('/dashboard/recent-orders', async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user.name,
      total: Number(order.totalAmount),
      status: order.orderStatus,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders'
    });
  }
});

// Get sales analytics
router.get('/dashboard/analytics', async (req, res) => {
  try {
    const period = req.query.period as string || '30d';
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Sales trend data
    const salesTrend = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate }
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      _count: {
        orderId: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 10
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, images: true }
        });
        return {
          productId: item.productId,
          name: product?.name || 'Unknown Product',
          images: product?.images || [],
          totalSold: item._sum.quantity || 0,
          totalRevenue: Number(item._sum.totalPrice || 0),
          orderCount: item._count.orderId || 0
        };
      })
    );

    // Top categories
    const topCategories = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate }
        }
      },
      _sum: {
        totalPrice: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 20
    });

    // Get category data
    const categoryData = await Promise.all(
      topCategories.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: { select: { name: true } } }
        });
        return {
          category: product?.category?.name || 'Uncategorized',
          revenue: Number(item._sum.totalPrice || 0)
        };
      })
    );

    // Group by category
    const categoryRevenue = categoryData.reduce((acc: Record<string, number>, item: any) => {
      const category = typeof item.category === 'string' ? item.category : 'Uncategorized';
      acc[category] = (acc[category] || 0) + item.revenue;
      return acc;
    }, {} as Record<string, number>);

    const topCategoriesFormatted = Object.entries(categoryRevenue).
    map(([category, revenue]) => ({ category, revenue })).
    sort((a: any, b: any) => b.revenue - a.revenue).
    slice(0, 10);

    // Order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['orderStatus'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    });

    // Payment method distribution
    const paymentMethodDistribution = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        salesTrend: salesTrend || [],
        topProducts: topProductsWithDetails,
        topCategories: topCategoriesFormatted,
        orderStatusDistribution: orderStatusDistribution.map((item: any) => ({
          status: item.orderStatus,
          count: item._count.id
        })),
        paymentMethodDistribution: paymentMethodDistribution.map((item: any) => ({
          method: item.paymentMethod,
          count: item._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// =============================
// Products - Admin CRUD
// =============================

router.get('/products', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const brand = req.query.brand as string || '';
    const status = req.query.status as string || '';

    const where: any = {};
    if (status) {
      where.isActive = status === 'active';
    }
    if (search) {
      // Search in JSON name fields by casting to text
      where.OR = [
      { slug: { contains: search, mode: 'insensitive' } }];

    }

    if (category) {
      where.category = {
        is: { slug: { equals: category } }
      };
    }

    if (brand) {
      where.brand = {
        is: { slug: { equals: brand } }
      };
    }

    const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { brand: true, category: true, variants: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })]
    );

    const data = items.map((p: any) => ({
      id: p.id,
      name: (p.name as any)?.en || (p.name as any)?.ar || '',
      description: (p.description as any)?.en || (p.description as any)?.ar || '',
      price: Number(p.basePrice),
      stockQuantity: p.stockQuantity,
      category: p.category ? (p.category.name as any)?.en || (p.category.name as any)?.ar || p.category.slug : '',
      brand: p.brand ? (p.brand.name as any)?.en || (p.brand.name as any)?.ar || p.brand.slug : '',
      images: p.images as unknown as string[] || [],
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin products list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { brand: true, category: true, variants: true, specifications: true }
    });
    if (!p) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: p });
  } catch (error) {
    console.error('Admin product fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const body = req.body as any;
    const createData: any = {
      name: typeof body.name === 'string' ? { en: body.name } as any : body.name,
      description: typeof body.description === 'string' ? { en: body.description } as any : body.description,
      sku: body.sku || `SKU-${Date.now()}`,
      basePrice: new Decimal(body.price ?? body.basePrice ?? 0) as any,
      salePrice: body.salePrice != null ? new Decimal(body.salePrice) as any : null,
      costPrice: body.costPrice != null ? new Decimal(body.costPrice) as any : null,
      images: (body.images || []) as any,
      status: body.status as keyof typeof ProductStatus || ProductStatus.ACTIVE,
      isActive: body.isActive ?? true,
      stockQuantity: body.stockQuantity ?? 0,
      lowStockThreshold: body.lowStockThreshold ?? 5,
      slug: body.slug || (body.name ? String(body.name).toLowerCase().replace(/\s+/g, '-') : `product-${Date.now()}`)
    };
    if (body.brandId) {
      (createData as any).brand = { connect: { id: body.brandId } };
    }
    if (body.categoryId) {
      (createData as any).category = { connect: { id: body.categoryId } };
    }
    const created = await prisma.product.create({ data: createData });
    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Admin product create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const body = req.body as any;
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = typeof body.name === 'string' ? { en: body.name } as any : body.name;
    if (body.description !== undefined) updateData.description = typeof body.description === 'string' ? { en: body.description } as any : body.description;
    if (body.price !== undefined) updateData.basePrice = new Decimal(body.price) as any;
    if (body.salePrice !== undefined) updateData.salePrice = body.salePrice != null ? new Decimal(body.salePrice) as any : null;
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice != null ? new Decimal(body.costPrice) as any : null;
    if (body.images !== undefined) updateData.images = body.images as any;
    if (body.status !== undefined) updateData.status = body.status as keyof typeof ProductStatus;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity;
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.brandId !== undefined) updateData.brand = body.brandId ? { connect: { id: body.brandId } } : { disconnect: true };
    if (body.categoryId !== undefined) updateData.category = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true };

    const updated = await prisma.product.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin product update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin product delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// =============================
// Categories - Admin CRUD
// =============================

router.get('/categories', async (_req, res) => {
  try {
    const items = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { parent: true, _count: { select: { products: true } } as any }
    } as any);
    const data = items.map((c: any) => ({
      id: c.id,
      name: c.name?.en || c.name?.ar || '',
      description: c.description?.en || c.description?.ar || '',
      slug: c.slug,
      image: c.image,
      parentId: c.parentId,
      parentName: c.parent ? c.parent.name?.en || c.parent.name?.ar || '' : null,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      productsCount: c._count?.products || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin categories list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const body = req.body as any;
    const created = await prisma.category.create({
      data: {
        name: typeof body.name === 'string' ? { en: body.name } : body.name,
        description: typeof body.description === 'string' ? { en: body.description } : body.description,
        image: body.image,
        parentId: body.parentId || null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        slug: body.slug || (body.name ? String(body.name).toLowerCase().replace(/\s+/g, '-') : `category-${Date.now()}`),
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription
      }
    });
    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Admin category create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const body = req.body as any;
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: typeof body.name === 'string' ? { en: body.name } : body.name,
        description: typeof body.description === 'string' ? { en: body.description } : body.description,
        image: body.image,
        parentId: body.parentId,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        slug: body.slug,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin category update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin category delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

router.put('/categories/reorder', async (req, res) => {
  try {
    const updates = req.body as any[] || [];
    await prisma.$transaction(
      updates.map((u) => prisma.category.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } }))
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Admin category reorder error:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder categories' });
  }
});

// =============================
// Flash Sales - Admin CRUD (Temporarily disabled until schema update)
// =============================

router.get('/flash-sales', async (_req, res) => {
  try {
    // Temporarily return empty array until schema is updated
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Admin flash sales list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flash sales' });
  }
});

router.post('/flash-sales', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Flash sales temporarily disabled until schema update' });
});

router.put('/flash-sales/:id', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Flash sales temporarily disabled until schema update' });
});

router.delete('/flash-sales/:id', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Flash sales temporarily disabled until schema update' });
});

// =============================
// Coupons - Admin CRUD (Temporarily disabled until schema update)
// =============================

router.get('/coupons', async (_req, res) => {
  try {
    // Temporarily return empty array until schema is updated
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Admin coupons list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Coupons temporarily disabled until schema update' });
});

router.put('/coupons/:id', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Coupons temporarily disabled until schema update' });
});

router.delete('/coupons/:id', async (_req, res) => {
  res.status(501).json({ success: false, message: 'Coupons temporarily disabled until schema update' });
});

// =============================
// Orders - Enhanced Management
// =============================

router.get('/orders', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    const paymentStatus = req.query.paymentStatus as string || '';

    const where: any = {};
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }];

    }

    const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
            variant: { select: { color: true, size: true } }
          }
        },
        timeline: { orderBy: { timestamp: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })]
    );

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin orders list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        timeline: { orderBy: { timestamp: 'asc' } }
      }
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Admin order fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { orderStatus: status }
    });

    // Add timeline entry
    const timelineData: any = {
      orderId: req.params.id,
      status: status,
      description: {
        ar: `تم تحديث حالة الطلب إلى ${status}`,
        en: `Order status updated to ${status}`
      }
    };

    if (notes) {
      timelineData.metadata = { notes };
    }

    await prisma.orderTimeline.create({
      data: timelineData
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin order status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// =============================
// Inventory Management
// =============================

router.get('/inventory', async (_req, res) => {
  try {
    const items = await prisma.product.findMany({
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const data = items.map((product: any) => ({
      id: product.id,
      productId: product.id,
      productName: product.name?.en || product.name?.ar || '',
      sku: product.sku,
      currentStock: product.stockQuantity || 0,
      lowStockThreshold: product.lowStockThreshold || 5,
      reservedStock: 0, // TODO: Calculate reserved stock
      availableStock: product.stockQuantity || 0,
      costPrice: Number(product.costPrice || 0),
      sellingPrice: Number(product.basePrice || 0),
      lastUpdated: product.updatedAt,
      status: product.stockQuantity === 0 ? 'OUT_OF_STOCK' :
      product.stockQuantity <= (product.lowStockThreshold || 5) ? 'LOW_STOCK' : 'IN_STOCK',
      supplier: null, // TODO: Add supplier relationship when schema is updated
      category: product.category ? {
        id: product.category.id,
        name: product.category.name?.en || product.category.name?.ar || ''
      } : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin inventory list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
});

router.put('/inventory/:id', async (req, res) => {
  try {
    const body = req.body as any;
    const updateData: any = {
      stockQuantity: body.currentStock,
      lowStockThreshold: body.lowStockThreshold
    };

    if (body.costPrice !== undefined) {
      updateData.costPrice = new Decimal(body.costPrice);
    }

    if (body.sellingPrice !== undefined) {
      updateData.basePrice = new Decimal(body.sellingPrice);
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin inventory update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory' });
  }
});

// =============================
// Suppliers Management
// =============================

router.get('/suppliers', async (_req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Admin suppliers list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const body = req.body as any;
    const created = await prisma.supplier.create({
      data: {
        name: body.name,
        contactPhone: body.contactPerson, // Using contactPhone field from existing schema
        email: body.email,
        phone: body.phone,
        address: body.address,
        isActive: body.isActive ?? true
      }
    });
    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Admin supplier create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create supplier' });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const body = req.body as any;
    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        contactPhone: body.contactPerson, // Using contactPhone field from existing schema
        email: body.email,
        phone: body.phone,
        address: body.address,
        isActive: body.isActive
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin supplier update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update supplier' });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin supplier delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supplier' });
  }
});

// =============================
// Purchase Orders Management
// =============================

router.get('/purchase-orders', async (_req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: order.supplier?.name || 'Unknown Supplier',
      totalAmount: Number(order.totalAmount),
      status: order.status,
      orderDate: order.orderDate,
      expectedDelivery: order.orderDate, // Using orderDate as fallback
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name?.en || item.product?.name?.ar || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin purchase orders list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const body = req.body as any;
    const orderNumber = `PO-${Date.now()}`;

    const created = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: body.supplierId as string,
        subtotal: new Decimal(body.totalAmount),
        totalAmount: new Decimal(body.totalAmount),
        status: (body.status || 'PENDING') as any,
        orderDate: new Date(body.orderDate),
        // expectedDelivery: new Date(body.expectedDelivery), // Field not in schema yet
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.totalPrice)
          }))
        }
      }
    });
    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Admin purchase order create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase order' });
  }
});

// =============================
// Customer Management
// =============================

router.get('/customers', async (_req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            orders: true,
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = customers.map((user: any) => {
      const totalSpent = user.orders.reduce((sum: number, order: any) =>
      sum + Number(order.totalAmount), 0
      );
      const lastOrder = user.orders[0];

      return {
        id: user.id,
        userId: user.id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone,
        loyaltyPoints: 0, // TODO: Calculate from loyalty transactions
        totalSpent,
        totalOrders: user._count.orders,
        lastOrderDate: lastOrder?.createdAt,
        preferences: {},
        tags: [],
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        addresses: user.addresses
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin customers list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const body = req.body as any;

    // Create user first
    const user = await prisma.user.create({
      data: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        role: 'CUSTOMER',
        isActive: body.isActive ?? true,
        isVerified: body.isVerified ?? false
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Admin customer create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const body = req.body as any;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        isActive: body.isActive,
        isVerified: body.isVerified
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin customer update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin customer delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
});

// =============================
// Customer Segments
// =============================

router.get('/customer-segments', async (_req, res) => {
  try {
    // Temporarily return empty array until schema is updated
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Admin customer segments list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer segments' });
  }
});

// =============================
// Loyalty Tiers
// =============================

router.get('/loyalty-tiers', async (_req, res) => {
  try {
    // Temporarily return empty array until schema is updated
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Admin loyalty tiers list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty tiers' });
  }
});

// =============================
// Wishlist Management
// =============================

router.get('/wishlists', async (_req, res) => {
  try {
    // Temporarily return empty array until schema is updated
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Admin wishlists list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlists' });
  }
});

// =============================
// Settings Management
// =============================

router.get('/settings/store', async (_req, res) => {
  try {
    // Temporarily return default settings until schema is updated
    const defaultSettings = {
      id: 'default',
      storeName: { en: 'Soleva Store', ar: 'متجر سوليفا' },
      storeDescription: { en: 'Premium footwear store', ar: 'متجر أحذية متميز' },
      storeLogo: '',
      storeFavicon: '',
      email: 'info@soleva.com',
      phone: '+20 123 456 7890',
      address: { en: 'Cairo, Egypt', ar: 'القاهرة، مصر' },
      taxNumber: '',
      businessLicense: '',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      language: 'en',
      socialMedia: { facebook: '', instagram: '', twitter: '' },
      metaTitle: { en: 'Soleva Store', ar: 'متجر سوليفا' },
      metaDescription: { en: 'Premium footwear', ar: 'أحذية متميزة' },
      metaKeywords: { en: 'shoes, footwear', ar: 'أحذية، حذاء' }
    };

    res.json({ success: true, data: defaultSettings });
  } catch (error) {
    console.error('Admin store settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store settings' });
  }
});

router.put('/settings/store', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Update store settings in database when schema is ready
    res.json({ success: true, data: body });
  } catch (error) {
    console.error('Admin store settings update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update store settings' });
  }
});

router.get('/settings/integrations', async (_req, res) => {
  try {
    const defaultSettings = {
      id: 'default',
      paymentGateways: {
        paymob: { enabled: true, apiKey: '' },
        fawry: { enabled: false, apiKey: '' }
      },
      shippingProviders: {
        aramex: { enabled: true, apiKey: '' }
      },
      emailService: {
        provider: 'sendgrid',
        apiKey: '',
        fromEmail: 'noreply@soleva.com'
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
        google: { enabled: true, clientId: '' },
        facebook: { enabled: false, clientId: '' }
      }
    };

    res.json({ success: true, data: defaultSettings });
  } catch (error) {
    console.error('Admin integration settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch integration settings' });
  }
});

router.put('/settings/integrations', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Update integration settings in database when schema is ready
    res.json({ success: true, data: body });
  } catch (error) {
    console.error('Admin integration settings update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update integration settings' });
  }
});

router.get('/settings/security', async (_req, res) => {
  try {
    const defaultSettings = {
      id: 'default',
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      twoFactorRequired: false,
      twoFactorMethods: {
        sms: true,
        email: true,
        authenticator: true
      },
      apiRateLimit: 100,
      apiKeyExpiry: 365,
      auditLogRetention: 90,
      logFailedAttempts: true
    };

    res.json({ success: true, data: defaultSettings });
  } catch (error) {
    console.error('Admin security settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch security settings' });
  }
});

router.put('/settings/security', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Update security settings in database when schema is ready
    res.json({ success: true, data: body });
  } catch (error) {
    console.error('Admin security settings update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update security settings' });
  }
});

// =============================
// Role-Based Access Control
// =============================

router.get('/roles', async (_req, res) => {
  try {
    // Temporarily return default roles until schema is updated
    const defaultRoles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all features',
      permissions: ['*'],
      isActive: true,
      usersCount: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manage products, orders, and customers',
      permissions: ['products.*', 'orders.*', 'customers.*', 'inventory.*'],
      isActive: true,
      usersCount: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'support',
      name: 'Support Agent',
      description: 'Handle customer support and orders',
      permissions: ['orders.read', 'orders.update', 'customers.read', 'chat.*'],
      isActive: true,
      usersCount: 0,
      createdAt: new Date().toISOString()
    }];


    res.json({ success: true, data: defaultRoles });
  } catch (error) {
    console.error('Admin roles list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Create role in database when schema is ready
    const newRole = {
      id: `role_${Date.now()}`,
      ...body,
      usersCount: 0,
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, data: newRole });
  } catch (error) {
    console.error('Admin role create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Update role in database when schema is ready
    res.json({ success: true, data: { id: req.params.id, ...body } });
  } catch (error) {
    console.error('Admin role update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

router.delete('/roles/:id', async (_req, res) => {
  try {
    // TODO: Delete role from database when schema is ready
    res.json({ success: true });
  } catch (error) {
    console.error('Admin role delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
});

router.get('/permissions', async (_req, res) => {
  try {
    const defaultPermissions = [
    // Products
    { id: 'products.create', name: 'products.create', resource: 'products', action: 'create', description: 'Create products' },
    { id: 'products.read', name: 'products.read', resource: 'products', action: 'read', description: 'View products' },
    { id: 'products.update', name: 'products.update', resource: 'products', action: 'update', description: 'Update products' },
    { id: 'products.delete', name: 'products.delete', resource: 'products', action: 'delete', description: 'Delete products' },

    // Orders
    { id: 'orders.create', name: 'orders.create', resource: 'orders', action: 'create', description: 'Create orders' },
    { id: 'orders.read', name: 'orders.read', resource: 'orders', action: 'read', description: 'View orders' },
    { id: 'orders.update', name: 'orders.update', resource: 'orders', action: 'update', description: 'Update orders' },
    { id: 'orders.delete', name: 'orders.delete', resource: 'orders', action: 'delete', description: 'Delete orders' },

    // Customers
    { id: 'customers.create', name: 'customers.create', resource: 'customers', action: 'create', description: 'Create customers' },
    { id: 'customers.read', name: 'customers.read', resource: 'customers', action: 'read', description: 'View customers' },
    { id: 'customers.update', name: 'customers.update', resource: 'customers', action: 'update', description: 'Update customers' },
    { id: 'customers.delete', name: 'customers.delete', resource: 'customers', action: 'delete', description: 'Delete customers' },

    // Inventory
    { id: 'inventory.create', name: 'inventory.create', resource: 'inventory', action: 'create', description: 'Create inventory' },
    { id: 'inventory.read', name: 'inventory.read', resource: 'inventory', action: 'read', description: 'View inventory' },
    { id: 'inventory.update', name: 'inventory.update', resource: 'inventory', action: 'update', description: 'Update inventory' },
    { id: 'inventory.delete', name: 'inventory.delete', resource: 'inventory', action: 'delete', description: 'Delete inventory' },

    // Chat
    { id: 'chat.create', name: 'chat.create', resource: 'chat', action: 'create', description: 'Create chat' },
    { id: 'chat.read', name: 'chat.read', resource: 'chat', action: 'read', description: 'View chat' },
    { id: 'chat.update', name: 'chat.update', resource: 'chat', action: 'update', description: 'Update chat' },
    { id: 'chat.delete', name: 'chat.delete', resource: 'chat', action: 'delete', description: 'Delete chat' },

    // Settings
    { id: 'settings.create', name: 'settings.create', resource: 'settings', action: 'create', description: 'Create settings' },
    { id: 'settings.read', name: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
    { id: 'settings.update', name: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
    { id: 'settings.delete', name: 'settings.delete', resource: 'settings', action: 'delete', description: 'Delete settings' }];


    res.json({ success: true, data: defaultPermissions });
  } catch (error) {
    console.error('Admin permissions list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch permissions' });
  }
});

// =============================
// AI Chat & Live Support
// =============================

router.get('/chat/conversations', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockConversations = [
    {
      id: 'conv_1',
      customerId: 'customer_1',
      customerName: 'Ahmed Hassan',
      customerEmail: 'ahmed@example.com',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      assignedTo: 'agent_1',
      assignedToName: 'Sarah Johnson',
      lastMessage: 'I need help with my order',
      lastMessageTime: new Date().toISOString(),
      messageCount: 5,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      tags: ['order', 'shipping'],
      source: 'WEBSITE'
    },
    {
      id: 'conv_2',
      customerId: 'customer_2',
      customerName: 'Fatima Ali',
      customerEmail: 'fatima@example.com',
      status: 'WAITING',
      priority: 'HIGH',
      assignedTo: null,
      assignedToName: null,
      lastMessage: 'My package was damaged',
      lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
      messageCount: 3,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      tags: ['complaint', 'damage'],
      source: 'MOBILE'
    }];


    res.json({ success: true, data: mockConversations });
  } catch (error) {
    console.error('Admin chat conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

router.get('/chat/conversations/:id', async (req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockConversation = {
      id: req.params.id,
      customerId: 'customer_1',
      customerName: 'Ahmed Hassan',
      customerEmail: 'ahmed@example.com',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      assignedTo: 'agent_1',
      assignedToName: 'Sarah Johnson',
      messages: [
      {
        id: 'msg_1',
        conversationId: req.params.id,
        senderId: 'customer_1',
        senderName: 'Ahmed Hassan',
        senderType: 'CUSTOMER',
        content: 'Hello, I need help with my order',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true
      },
      {
        id: 'msg_2',
        conversationId: req.params.id,
        senderId: 'agent_1',
        senderName: 'Sarah Johnson',
        senderType: 'AGENT',
        content: 'Hello Ahmed! I\'d be happy to help you with your order. Can you please provide your order number?',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        isRead: true
      },
      {
        id: 'msg_3',
        conversationId: req.params.id,
        senderId: 'customer_1',
        senderName: 'Ahmed Hassan',
        senderType: 'CUSTOMER',
        content: 'My order number is #12345',
        timestamp: new Date(Date.now() - 3400000).toISOString(),
        isRead: true
      }]

    };

    res.json({ success: true, data: mockConversation });
  } catch (error) {
    console.error('Admin chat conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
});

router.post('/chat/conversations/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;
    // TODO: Save message to database when schema is ready
    const newMessage = {
      id: `msg_${Date.now()}`,
      conversationId: req.params.id,
      senderId: 'agent_1', // Current admin user
      senderName: 'Admin User',
      senderType: 'AGENT',
      content: message,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Admin chat send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

router.put('/chat/conversations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    // TODO: Update conversation status in database when schema is ready
    res.json({ success: true, data: { id: req.params.id, status } });
  } catch (error) {
    console.error('Admin chat update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

router.get('/chat/bots', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockBots = [
    {
      id: 'bot_1',
      name: 'Customer Support Bot',
      description: 'Handles general customer inquiries',
      model: 'gpt-3.5-turbo',
      systemPrompt: 'You are a helpful customer support assistant for Soleva store.',
      temperature: 0.7,
      maxTokens: 1000,
      autoRespond: true,
      isActive: true,
      conversationsCount: 150,
      successRate: 85
    },
    {
      id: 'bot_2',
      name: 'Order Status Bot',
      description: 'Provides order status updates',
      model: 'gpt-3.5-turbo',
      systemPrompt: 'You help customers check their order status and shipping information.',
      temperature: 0.5,
      maxTokens: 500,
      autoRespond: true,
      isActive: true,
      conversationsCount: 89,
      successRate: 92
    }];


    res.json({ success: true, data: mockBots });
  } catch (error) {
    console.error('Admin chat bots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat bots' });
  }
});

router.get('/chat/escalation-rules', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockRules = [
    {
      id: 'rule_1',
      name: 'Complaint Escalation',
      description: 'Escalate conversations with complaint keywords',
      conditions: {
        keywords: ['complaint', 'refund', 'return', 'damaged'],
        sentiment: 'negative'
      },
      actions: {
        notifyAdmins: true,
        assignTo: 'support_team',
        priority: 'HIGH'
      },
      priority: 1,
      isActive: true,
      triggerCount: 23
    },
    {
      id: 'rule_2',
      name: 'VIP Customer Escalation',
      description: 'Escalate conversations from VIP customers',
      conditions: {
        customerTier: 'VIP',
        tags: ['premium']
      },
      actions: {
        notifyAdmins: true,
        assignTo: 'vip_support',
        priority: 'HIGH'
      },
      priority: 2,
      isActive: true,
      triggerCount: 8
    }];


    res.json({ success: true, data: mockRules });
  } catch (error) {
    console.error('Admin escalation rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch escalation rules' });
  }
});

// =============================
// Multi-Store Management
// =============================

router.get('/multi-store/stores', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockStores = [
    {
      id: 'store_1',
      name: { en: 'Cairo Store', ar: 'متجر القاهرة' },
      description: { en: 'Main store in Cairo', ar: 'المتجر الرئيسي في القاهرة' },
      domain: 'cairo.soleva.com',
      subdomain: 'cairo',
      logo: '',
      favicon: '',
      email: 'cairo@soleva.com',
      phone: '+20 123 456 7890',
      address: { en: 'Cairo, Egypt', ar: 'القاهرة، مصر' },
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      language: 'en',
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productsCount: 150,
      ordersCount: 45,
      revenue: 12500.00
    },
    {
      id: 'store_2',
      name: { en: 'Alexandria Store', ar: 'متجر الإسكندرية' },
      description: { en: 'Store in Alexandria', ar: 'متجر في الإسكندرية' },
      domain: 'alex.soleva.com',
      subdomain: 'alex',
      logo: '',
      favicon: '',
      email: 'alex@soleva.com',
      phone: '+20 123 456 7891',
      address: { en: 'Alexandria, Egypt', ar: 'الإسكندرية، مصر' },
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      language: 'en',
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productsCount: 120,
      ordersCount: 32,
      revenue: 8900.00
    }];


    res.json({ success: true, data: mockStores });
  } catch (error) {
    console.error('Admin multi-store stores error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stores' });
  }
});

router.post('/multi-store/stores', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Create store in database when schema is ready
    const newStore = {
      id: `store_${Date.now()}`,
      ...body,
      productsCount: 0,
      ordersCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ success: true, data: newStore });
  } catch (error) {
    console.error('Admin multi-store create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create store' });
  }
});

router.put('/multi-store/stores/:id', async (req, res) => {
  try {
    const body = req.body as any;
    // TODO: Update store in database when schema is ready
    res.json({ success: true, data: { id: req.params.id, ...body } });
  } catch (error) {
    console.error('Admin multi-store update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update store' });
  }
});

router.delete('/multi-store/stores/:id', async (_req, res) => {
  try {
    // TODO: Delete store from database when schema is ready
    res.json({ success: true });
  } catch (error) {
    console.error('Admin multi-store delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete store' });
  }
});

router.get('/multi-store/products', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockProducts = [
    {
      id: 'sp_1',
      storeId: 'store_1',
      productId: 'product_1',
      productName: 'Classic Leather Shoes',
      price: 299.99,
      comparePrice: 399.99,
      costPrice: 150.00,
      stockQuantity: 25,
      lowStockThreshold: 5,
      isActive: true,
      isFeatured: true,
      sortOrder: 1
    },
    {
      id: 'sp_2',
      storeId: 'store_1',
      productId: 'product_2',
      productName: 'Running Sneakers',
      price: 199.99,
      comparePrice: null,
      costPrice: 100.00,
      stockQuantity: 15,
      lowStockThreshold: 5,
      isActive: true,
      isFeatured: false,
      sortOrder: 2
    }];


    res.json({ success: true, data: mockProducts });
  } catch (error) {
    console.error('Admin multi-store products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store products' });
  }
});

router.get('/multi-store/inventory', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockInventory = [
    {
      id: 'si_1',
      storeId: 'store_1',
      productId: 'product_1',
      productName: 'Classic Leather Shoes',
      variantId: 'variant_1',
      variantName: 'Black - Size 42',
      stockQuantity: 25,
      reservedQuantity: 3,
      availableQuantity: 22,
      lowStockThreshold: 5,
      warehouse: 'Main Warehouse',
      shelf: 'A-1',
      bin: 'B-15',
      status: 'IN_STOCK'
    },
    {
      id: 'si_2',
      storeId: 'store_1',
      productId: 'product_2',
      productName: 'Running Sneakers',
      variantId: 'variant_2',
      variantName: 'White - Size 40',
      stockQuantity: 2,
      reservedQuantity: 0,
      availableQuantity: 2,
      lowStockThreshold: 5,
      warehouse: 'Main Warehouse',
      shelf: 'A-2',
      bin: 'B-20',
      status: 'LOW_STOCK'
    }];


    res.json({ success: true, data: mockInventory });
  } catch (error) {
    console.error('Admin multi-store inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store inventory' });
  }
});

router.get('/multi-store/promotions', async (_req, res) => {
  try {
    // Temporarily return mock data until schema is updated
    const mockPromotions = [
    {
      id: 'promo_1',
      storeId: 'store_1',
      name: { en: 'Summer Sale', ar: 'تخفيضات الصيف' },
      description: { en: '20% off all summer items', ar: 'خصم 20% على جميع منتجات الصيف' },
      type: 'DISCOUNT_PERCENTAGE',
      value: 20.00,
      targetProducts: ['product_1', 'product_2'],
      targetCategories: ['category_1'],
      targetCustomers: [],
      minOrderValue: 100.00,
      maxUsage: 100,
      usageCount: 25,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    },
    {
      id: 'promo_2',
      storeId: 'store_2',
      name: { en: 'Free Shipping', ar: 'شحن مجاني' },
      description: { en: 'Free shipping on orders over $50', ar: 'شحن مجاني للطلبات أكثر من 50 دولار' },
      type: 'FREE_SHIPPING',
      value: 0.00,
      targetProducts: [],
      targetCategories: [],
      targetCustomers: [],
      minOrderValue: 50.00,
      maxUsage: null,
      usageCount: 15,
      startDate: new Date().toISOString(),
      endDate: null,
      isActive: true
    }];


    res.json({ success: true, data: mockPromotions });
  } catch (error) {
    console.error('Admin multi-store promotions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store promotions' });
  }
});

export default router;