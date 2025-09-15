import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard stats
router.get('/dashboard/stats', async (_req, res) => {
  try {
    const [totalOrders, totalRevenue, totalCustomers, lowStockItems] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true }
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.product.count({
        where: { stockQuantity: { lte: 5 } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalCustomers,
        lowStockItems,
        ordersGrowth: 0, // TODO: Calculate growth
        revenueGrowth: 0, // TODO: Calculate growth
        customersGrowth: 0 // TODO: Calculate growth
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

    const formattedOrders = orders.map(order => ({
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

export default router;
