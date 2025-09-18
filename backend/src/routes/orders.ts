import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all orders (admin)
router.get('/', async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        address: true,
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        timeline: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get user's orders (authenticated)
router.get('/user', auth, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
  prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true
            }
          },
          variant: {
            select: {
              color: true,
              size: true
            }
          }
        }
      },
      address: true,
      timeline: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  }),
  prisma.order.count({ where: { userId } })]
  );

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get order by ID (authenticated - user can only see their own orders)
router.get('/:id', auth, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const orderId = req.params.id;

  if (!orderId) {
    res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
    return;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true }
      },
      address: true,
      items: {
        include: {
          product: true,
          variant: true
        }
      },
      timeline: {
        orderBy: { timestamp: 'asc' }
      }
    }
  });

  if (!order) {
    res.status(404).json({
      success: false,
      message: 'Order not found'
    });
    return;
  }

  res.json({
    success: true,
    data: order
  });
}));

export default router;