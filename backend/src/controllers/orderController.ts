import { Response } from 'express';
import { PrismaClient, PaymentMethod, PaymentStatus, OrderStatus, ShippingStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/orderUtils';
import { calculateShippingCost } from '../services/shippingService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditService';

const prisma = new PrismaClient();

// Validation schemas
const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'BANK_WALLET', 'DIGITAL_WALLET']),
  senderNumber: z.string().optional(),
  couponCode: z.string().optional(),
  customerNotes: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'AWAITING_PROOF', 'UNDER_REVIEW', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  shippingStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED']).optional(),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional()
});

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *               - paymentMethod
 *             properties:
 *               addressId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH_ON_DELIVERY, BANK_WALLET, DIGITAL_WALLET]
 *               senderNumber:
 *                 type: string
 *               couponCode:
 *                 type: string
 *               customerNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or empty cart
 *       404:
 *         description: Address not found
 */
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { addressId, paymentMethod, senderNumber, couponCode, customerNotes } = createOrderSchema.parse(req.body);
  const userId = req.user!.id;

  // Get user's cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          brand: true,
          category: true
        }
      },
      variant: true
    }
  });

  if (cartItems.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
      isActive: true
    }
  });

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of cartItems) {
    const product = item.product;
    const variant = item.variant;

    // Check stock availability
    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
    if (availableStock < item.quantity) {
      throw new ValidationError(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = variant ?
    Number(product.basePrice) + Number(variant.priceDelta) :
    Number(product.basePrice);

    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      productId: product.id,
      variantId: variant?.id,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      productSnapshot: {
        name: product.name,
        description: product.description,
        images: product.images,
        brand: product.brand?.name,
        category: product.category?.name,
        variant: variant ? {
          color: variant.color,
          size: variant.size,
          material: variant.material
        } : null
      }
    });
  }

  // Apply coupon if provided
  let discountAmount = 0;
  let couponData = null;

  if (couponCode) {
    couponData = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
        { validTo: null },
        { validTo: { gte: new Date() } }],

        AND: [
        {
          OR: [
          { usageLimit: null },
          { usageCount: { lt: prisma.coupon.fields.usageLimit } }]

        }]

      }
    });

    if (!couponData) {
      throw new ValidationError('Invalid or expired coupon');
    }

    // Check minimum order value
    if (couponData.minOrderValue && subtotal < Number(couponData.minOrderValue)) {
      throw new ValidationError(`Minimum order value of ${couponData.minOrderValue} EGP required for this coupon`);
    }

    // Calculate discount
    if (couponData.type === 'PERCENTAGE') {
      discountAmount = subtotal * Number(couponData.value) / 100;
      if (couponData.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(couponData.maxDiscount));
      }
    } else if (couponData.type === 'FIXED_AMOUNT') {
      discountAmount = Number(couponData.value);
    }
  }

  // Calculate shipping cost
  const shippingCost = await calculateShippingCost(address.governorate, subtotal - discountAmount);

  // Calculate final total
  const totalAmount = subtotal - discountAmount + shippingCost;

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        discountAmount,
        shippingCost,
        totalAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? PaymentStatus.PENDING : PaymentStatus.AWAITING_PROOF,
        orderStatus: OrderStatus.PENDING,
        shippingStatus: ShippingStatus.PENDING,
        senderNumber: senderNumber || null,
        couponCode: couponData?.code || null,
        customerNotes: customerNotes || null,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        address: true,
        user: true
      }
    });

    // Update coupon usage
    if (couponData) {
      await tx.coupon.update({
        where: { id: couponData.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Update inventory
    for (const item of cartItems) {
      if (item.variant) {
        await tx.productVariant.update({
          where: { id: item.variant.id },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      } else {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }

      // Create inventory movement record
      await tx.inventoryMovement.create({
        data: {
          productId: item.product.id,
          variantId: item.variant?.id || null,
          type: 'SALE',
          quantity: -item.quantity,
          reference: newOrder.id,
          reason: `Order ${orderNumber}`
        }
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { userId }
    });

    // Create initial order timeline
    await tx.orderTimeline.create({
      data: {
        orderId: newOrder.id,
        status: 'PENDING',
        description: {
          ar: 'تم إنشاء الطلب',
          en: 'Order created'
        }
      }
    });

    return newOrder;
  });

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(order);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't fail the order creation if email fails
  }

  // Create audit log
  await createAuditLog({
    userId,
    action: 'CREATE',
    resource: 'Order',
    resourceId: order.id,
    newValues: { orderNumber: order.orderNumber, totalAmount }
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    }
  });
});

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
export const getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;
  const userId = req.user!.id;

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
      address: true
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
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
export const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const order = await prisma.order.findFirst({
    where: {
      id: id || '',
      userId
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              slug: true
            }
          },
          variant: {
            select: {
              color: true,
              size: true,
              material: true
            }
          }
        }
      },
      address: true,
      timeline: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @swagger
 * /api/v1/orders/{id}/upload-payment-proof:
 *   post:
 *     summary: Upload payment proof for bank/digital wallet orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 *       400:
 *         description: Invalid file or order status
 *       404:
 *         description: Order not found
 */
export const uploadPaymentProof = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if file was uploaded
  if (!req.file) {
    throw new ValidationError('Payment proof file is required');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: id || '',
      userId,
      paymentMethod: { in: ['BANK_WALLET', 'DIGITAL_WALLET'] },
      paymentStatus: { in: ['AWAITING_PROOF', 'UNDER_REVIEW'] }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found or payment proof not required');
  }

  // Update order with payment proof
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentProofUrl: req.file.path,
      paymentStatus: PaymentStatus.UNDER_REVIEW
    }
  });

  // Add timeline entry
  await prisma.orderTimeline.create({
    data: {
      orderId: order.id,
      status: 'PAYMENT_PROOF_UPLOADED',
      description: {
        ar: 'تم رفع إثبات الدفع',
        en: 'Payment proof uploaded'
      }
    }
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'UPDATE',
    resource: 'Order',
    resourceId: order.id,
    newValues: { paymentStatus: 'UNDER_REVIEW', paymentProofUrl: req.file.path }
  });

  res.json({
    success: true,
    message: 'Payment proof uploaded successfully',
    data: {
      paymentStatus: updatedOrder.paymentStatus,
      paymentProofUrl: updatedOrder.paymentProofUrl
    }
  });
});

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */
export const cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.id;

  const order = await prisma.order.findFirst({
    where: {
      id: id || '',
      userId,
      orderStatus: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found or cannot be cancelled');
  }

  // Cancel order in transaction
  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        adminNotes: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer'
      }
    });

    // Restore inventory
    for (const item of order.items) {
      if (item.variant) {
        await tx.productVariant.update({
          where: { id: item.variantId! },
          data: { stockQuantity: { increment: item.quantity } }
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } }
        });
      }

      // Create inventory movement record
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: 'RETURN',
          quantity: item.quantity,
          reference: order.id,
          reason: `Order ${order.orderNumber} cancelled`
        }
      });
    }

    // Add timeline entry
    await tx.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'CANCELLED',
        description: {
          ar: 'تم إلغاء الطلب',
          en: 'Order cancelled'
        }
      }
    });
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: 'UPDATE',
    resource: 'Order',
    resourceId: order.id,
    newValues: { orderStatus: 'CANCELLED', reason }
  });

  res.json({
    success: true,
    message: 'Order cancelled successfully'
  });
});

// Admin-only functions
export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const rawUpdateData = updateOrderStatusSchema.parse(req.body);
  const adminId = req.user!.id;

  // Filter out undefined values
  const updateData: any = {};
  Object.keys(rawUpdateData).forEach((key) => {
    if ((rawUpdateData as any)[key] !== undefined) {
      updateData[key] = (rawUpdateData as any)[key];
    }
  });

  const order = await prisma.order.findUnique({
    where: { id: id || '' },
    include: {
      items: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData
  });

  // Add timeline entry if status changed
  if (updateData.orderStatus && updateData.orderStatus !== order.orderStatus) {
    const statusMessages = {
      PENDING: { ar: 'في الانتظار', en: 'Pending' },
      CONFIRMED: { ar: 'تم التأكيد', en: 'Confirmed' },
      PROCESSING: { ar: 'جاري التحضير', en: 'Processing' },
      SHIPPED: { ar: 'تم الشحن', en: 'Shipped' },
      DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
      CANCELLED: { ar: 'تم الإلغاء', en: 'Cancelled' },
      RETURNED: { ar: 'تم الإرجاع', en: 'Returned' },
      REFUNDED: { ar: 'تم الاسترداد', en: 'Refunded' }
    };

    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: updateData.orderStatus,
        description: statusMessages[updateData.orderStatus as keyof typeof statusMessages]
      }
    });
  }

  // Create audit log
  await createAuditLog({
    adminId,
    action: 'UPDATE',
    resource: 'Order',
    resourceId: order.id,
    oldValues: order,
    newValues: updateData
  });

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: updatedOrder
  });
});