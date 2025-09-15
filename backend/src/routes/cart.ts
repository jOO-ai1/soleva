import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get cart items
router.get('/', async (req, res): Promise<Response | void> => {
  try {
    // This would normally use auth middleware to get user ID
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
        variant: true
      }
    });

    res.json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// Add item to cart
router.post('/', async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId,
          productId,
          variantId: variantId || null
        }
      },
      update: {
        quantity: { increment: quantity || 1 }
      },
      create: {
        userId,
        productId,
        variantId: variantId || null,
        quantity: quantity || 1
      },
      include: {
        product: true,
        variant: true
      }
    });

    res.json({
      success: true,
      data: cartItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

export default router;
