import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Track order by order number or ID (public endpoint)
router.get('/:identifier', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const identifier = req.params.identifier;

  if (!identifier) {
    res.status(400).json({
      success: false,
      message: 'Order identifier is required'
    });
    return;
  }

  // Try to find order by orderNumber or ID
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: identifier },
        { id: identifier }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      address: true,
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
