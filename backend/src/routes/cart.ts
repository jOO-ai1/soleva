import express, { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Guest cart storage (in-memory for now, could be Redis in production)
const guestCarts = new Map<string, any[]>();

// Get cart items (authenticated users)
router.get('/', async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const userId = req.user!.id;

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

// Get guest cart items
router.get('/guest/:sessionId', async (req: Request, res): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    const guestCart = guestCarts.get(sessionId) || [];

    res.json({
      success: true,
      data: guestCart
    });
  } catch (error) {
    console.error('Guest cart fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guest cart'
    });
  }
});

// Add item to cart (authenticated users)
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { productId, variantId, quantity } = req.body;

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

// Add item to guest cart
router.post('/guest/:sessionId', async (req: Request, res): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    const { productId, variantId, quantity, product } = req.body;

    const guestCart = guestCarts.get(sessionId) || [];

    // Check if item already exists
    const existingItemIndex = guestCart.findIndex((item) =>
    item.productId === productId && item.variantId === variantId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      guestCart[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item
      guestCart.push({
        id: Date.now().toString(),
        productId,
        variantId: variantId || null,
        quantity: quantity || 1,
        product: product || { id: productId },
        variant: variantId ? { id: variantId } : null
      });
    }

    guestCarts.set(sessionId, guestCart);

    res.json({
      success: true,
      data: guestCart
    });
  } catch (error) {
    console.error('Add to guest cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to guest cart'
    });
  }
});

// Update guest cart item quantity
router.put('/guest/:sessionId/:itemId', async (req: Request, res): Promise<Response | void> => {
  try {
    const { sessionId, itemId } = req.params;
    if (!sessionId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and Item ID are required'
      });
    }
    const { quantity } = req.body;

    const guestCart = guestCarts.get(sessionId) || [];
    const itemIndex = guestCart.findIndex((item) => item.id === itemId);

    if (itemIndex >= 0) {
      guestCart[itemIndex].quantity = Math.max(1, quantity);
      guestCarts.set(sessionId, guestCart);
    }

    res.json({
      success: true,
      data: guestCart
    });
  } catch (error) {
    console.error('Update guest cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update guest cart'
    });
  }
});

// Remove item from guest cart
router.delete('/guest/:sessionId/:itemId', async (req: Request, res): Promise<Response | void> => {
  try {
    const { sessionId, itemId } = req.params;
    if (!sessionId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and Item ID are required'
      });
    }

    const guestCart = guestCarts.get(sessionId) || [];
    const updatedGuestCart = guestCart.filter((item) => item.id !== itemId);
    guestCarts.set(sessionId, updatedGuestCart);

    res.json({
      success: true,
      data: updatedGuestCart
    });
  } catch (error) {
    console.error('Remove from guest cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from guest cart'
    });
  }
});

// Clear guest cart
router.delete('/guest/:sessionId', async (req: Request, res): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    guestCarts.set(sessionId, []);

    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Clear guest cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear guest cart'
    });
  }
});

export default router;