import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a unique order number
 * Format: SOL-YYYYMMDD-XXXXX
 * Example: SOL-20231201-00001
 */
export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Get the count of orders created today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayOrdersCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  });

  // Generate sequential number (starting from 1)
  const sequentialNumber = String(todayOrdersCount + 1).padStart(5, '0');

  return `SOL-${datePrefix}-${sequentialNumber}`;
};

/**
 * Parse order number to extract date and sequence
 */
export const parseOrderNumber = (orderNumber: string): {date: string;sequence: number;} | null => {
  const match = orderNumber.match(/^SOL-(\d{8})-(\d{5})$/);
  if (!match) return null;

  return {
    date: match[1]!,
    sequence: parseInt(match[2]!, 10)
  };
};

/**
 * Calculate order totals
 */
export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}

export const calculateOrderTotals = (
items: Array<{quantity: number;unitPrice: number;}>,
discountAmount: number = 0,
shippingCost: number = 0,
taxRate: number = 0)
: OrderTotals => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

  return {
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount
  };
};

/**
 * Validate order items have sufficient stock
 */
export const validateOrderStock = async (
items: Array<{productId: string;variantId?: string;quantity: number;}>)
: Promise<{valid: boolean;errors: string[];}> => {
  const errors: string[] = [];

  for (const item of items) {
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true }
      });

      if (!variant) {
        errors.push(`Product variant not found: ${item.variantId}`);
        continue;
      }

      if (variant.stockQuantity < item.quantity) {
        errors.push(`Insufficient stock for ${variant.product.name}: ${variant.stockQuantity} available, ${item.quantity} requested`);
      }
    } else {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        errors.push(`Product not found: ${item.productId}`);
        continue;
      }

      if (product.stockQuantity < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}: ${product.stockQuantity} available, ${item.quantity} requested`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get order status display text
 */
export const getOrderStatusText = (status: string, lang: 'ar' | 'en' = 'en') => {
  const statusTexts = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    CONFIRMED: { ar: 'تم التأكيد', en: 'Confirmed' },
    PROCESSING: { ar: 'جاري التحضير', en: 'Processing' },
    SHIPPED: { ar: 'تم الشحن', en: 'Shipped' },
    DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
    CANCELLED: { ar: 'تم الإلغاء', en: 'Cancelled' },
    RETURNED: { ar: 'تم الإرجاع', en: 'Returned' },
    REFUNDED: { ar: 'تم الاسترداد', en: 'Refunded' }
  };

  return statusTexts[status as keyof typeof statusTexts]?.[lang] || status;
};

/**
 * Get payment status display text
 */
export const getPaymentStatusText = (status: string, lang: 'ar' | 'en' = 'en') => {
  const statusTexts = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    AWAITING_PROOF: { ar: 'في انتظار إثبات الدفع', en: 'Awaiting Payment Proof' },
    UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review' },
    PAID: { ar: 'تم الدفع', en: 'Paid' },
    FAILED: { ar: 'فشل الدفع', en: 'Payment Failed' },
    REFUNDED: { ar: 'تم الاسترداد', en: 'Refunded' },
    PARTIALLY_REFUNDED: { ar: 'استرداد جزئي', en: 'Partially Refunded' }
  };

  return statusTexts[status as keyof typeof statusTexts]?.[lang] || status;
};

/**
 * Get shipping status display text
 */
export const getShippingStatusText = (status: string, lang: 'ar' | 'en' = 'en') => {
  const statusTexts = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    PROCESSING: { ar: 'جاري التحضير', en: 'Processing' },
    SHIPPED: { ar: 'تم الشحن', en: 'Shipped' },
    OUT_FOR_DELIVERY: { ar: 'في الطريق للتسليم', en: 'Out for Delivery' },
    DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
    FAILED_DELIVERY: { ar: 'فشل التسليم', en: 'Delivery Failed' },
    RETURNED: { ar: 'تم الإرجاع', en: 'Returned' }
  };

  return statusTexts[status as keyof typeof statusTexts]?.[lang] || status;
};

/**
 * Calculate estimated delivery date
 */
export const calculateEstimatedDelivery = (
orderDate: Date,
governorate: string,
shippingMethod: string = 'standard')
: Date => {
  const estimatedDays = getDeliveryDays(governorate, shippingMethod);
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

  // Skip weekends (Friday and Saturday in Egypt)
  while (deliveryDate.getDay() === 5 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  return deliveryDate;
};

/**
 * Get delivery days based on governorate
 */
const getDeliveryDays = (governorate: string, shippingMethod: string): number => {
  // This could be made configurable in the database
  const deliveryTimes: Record<string, Record<string, number>> = {
    standard: {
      'CAI': 1, // Cairo
      'GIZ': 1, // Giza
      'ALX': 2, // Alexandria
      'QLY': 2, // Qalyubia
      default: 3
    },
    express: {
      'CAI': 1,
      'GIZ': 1,
      'ALX': 1,
      'QLY': 1,
      default: 2
    }
  };

  return deliveryTimes[shippingMethod]?.[governorate] || deliveryTimes[shippingMethod]?.default || 3;
};

/**
 * Format order number for display
 */
export const formatOrderNumber = (orderNumber: string): string => {
  // Add spaces for better readability: SOL-20231201-00001 -> SOL 20231201 00001
  return orderNumber.replace(/-/g, ' ');
};

/**
 * Check if order can be cancelled
 */
export const canCancelOrder = (orderStatus: string, paymentStatus: string): boolean => {
  const cancellableOrderStatuses = ['PENDING', 'CONFIRMED'];
  const cancellablePaymentStatuses = ['PENDING', 'AWAITING_PROOF', 'UNDER_REVIEW'];

  return cancellableOrderStatuses.includes(orderStatus) &&
  cancellablePaymentStatuses.includes(paymentStatus);
};

/**
 * Check if order can be returned
 */
export const canReturnOrder = (orderStatus: string, deliveryDate: Date | null): boolean => {
  if (orderStatus !== 'DELIVERED' || !deliveryDate) {
    return false;
  }

  // Allow returns within 14 days of delivery
  const returnPeriod = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
  const now = new Date();

  return now.getTime() - deliveryDate.getTime() <= returnPeriod;
};

/**
 * Generate order tracking URL (for integration with shipping providers)
 */
export const generateTrackingUrl = (trackingNumber: string, provider: string = 'soleva'): string => {
  const trackingUrls: Record<string, string> = {
    soleva: `https://track.solevaeg.com/${trackingNumber}`,
    aramex: `https://www.aramex.com/track/results?ShipmentNumber=${trackingNumber}`,
    bosta: `https://bosta.co/tracking-shipment/?track_id=${trackingNumber}`,
    mylerz: `https://mylerz.com/track/${trackingNumber}`
  };

  const url = trackingUrls[provider];
  return url || `https://track.solevaeg.com/${trackingNumber}`;
};