import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ShippingCalculation {
  cost: number;
  isFree: boolean;
  threshold: number;
  governorate: string;
  center?: string | undefined;
  village?: string | undefined;
}

/**
 * Calculate shipping cost based on location and order total
 */
export const calculateShippingCost = async (
  governorate: string,
  orderTotal: number,
  center?: string,
  village?: string
): Promise<number> => {
  const freeShippingThreshold = parseFloat(process.env.SHIPPING_FREE_THRESHOLD || '500');
  
  // Check if order qualifies for free shipping
  if (orderTotal >= freeShippingThreshold) {
    return 0;
  }

  // Get shipping rate from most specific location
  let shippingRate;

  if (village) {
    shippingRate = await prisma.shippingRate.findFirst({
      where: {
        villageId: village,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      include: {
        village: {
          include: {
            center: {
              include: {
                governorate: true
              }
            }
          }
        }
      }
    });
  }

  if (!shippingRate && center) {
    shippingRate = await prisma.shippingRate.findFirst({
      where: {
        centerId: center,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      include: {
        center: {
          include: {
            governorate: true
          }
        }
      }
    });
  }

  if (!shippingRate) {
    shippingRate = await prisma.shippingRate.findFirst({
      where: {
        governorateId: governorate,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      include: {
        governorate: true
      }
    });
  }

  // If no specific rate found, use default
  if (!shippingRate) {
    return parseFloat(process.env.DEFAULT_SHIPPING_COST || '60');
  }

  // Check if this rate has a free shipping threshold
  if (shippingRate.freeThreshold && orderTotal >= Number(shippingRate.freeThreshold)) {
    return 0;
  }

  return Number(shippingRate.cost);
};

/**
 * Get detailed shipping calculation with breakdown
 */
export const getShippingCalculation = async (
  governorate: string,
  orderTotal: number,
  center?: string,
  village?: string
): Promise<ShippingCalculation> => {
  const freeShippingThreshold = parseFloat(process.env.SHIPPING_FREE_THRESHOLD || '500');
  const cost = await calculateShippingCost(governorate, orderTotal, center, village);
  
  return {
    cost,
    isFree: cost === 0,
    threshold: freeShippingThreshold,
    governorate,
    center: center || undefined,
    village: village || undefined
  };
};

/**
 * Get all governorates with shipping costs
 */
export const getGovernoratesWithShipping = async () => {
  const governorates = await prisma.governorate.findMany({
    where: { isActive: true },
    include: {
      shippingRates: {
        where: {
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        },
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      centers: {
        where: { isActive: true },
        include: {
          villages: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return governorates.map(gov => ({
    id: gov.id,
    name: gov.name,
    code: gov.code,
    shippingCost: gov.shippingRates[0]?.cost || gov.shippingCost,
    centers: gov.centers.map(center => ({
      id: center.id,
      name: center.name,
      code: center.code,
      shippingCost: center.shippingCost,
      villages: center.villages.map(village => ({
        id: village.id,
        name: village.name,
        code: village.code,
        type: village.type,
        shippingCost: village.shippingCost
      }))
    }))
  }));
};

/**
 * Get shipping zones (governorates grouped by shipping cost)
 */
export const getShippingZones = async () => {
  const governorates = await getGovernoratesWithShipping();
  const zones: Record<number, any[]> = {};

  governorates.forEach(gov => {
    const cost = Number(gov.shippingCost);
    if (!zones[cost]) {
      zones[cost] = [];
    }
    zones[cost].push(gov);
  });

  return Object.entries(zones).map(([cost, govs]) => ({
    cost: parseFloat(cost),
    governorates: govs
  })).sort((a, b) => a.cost - b.cost);
};

/**
 * Validate shipping address
 */
export const validateShippingAddress = async (
  governorateId: string,
  centerId?: string,
  villageId?: string
): Promise<boolean> => {
  // Check governorate exists and is active
  const governorate = await prisma.governorate.findFirst({
    where: { id: governorateId, isActive: true }
  });

  if (!governorate) {
    return false;
  }

  // Check center if provided
  if (centerId) {
    const center = await prisma.centers.findFirst({
      where: { 
        id: centerId, 
        governorateId,
        isActive: true 
      }
    });

    if (!center) {
      return false;
    }

    // Check village if provided
    if (villageId) {
      const village = await prisma.village.findFirst({
        where: { 
          id: villageId, 
          centerId,
          isActive: true 
        }
      });

      return !!village;
    }
  }

  return true;
};

/**
 * Get estimated delivery time
 */
export const getEstimatedDeliveryTime = async (
  governorate: string,
  _center?: string,
  _village?: string
): Promise<{ min: number; max: number; unit: string }> => {
  // Default delivery times (in days)
  const defaultTimes = {
    cairo: { min: 1, max: 2, unit: 'days' },
    giza: { min: 1, max: 2, unit: 'days' },
    alexandria: { min: 2, max: 3, unit: 'days' },
    default: { min: 3, max: 5, unit: 'days' }
  };

  // Get governorate info
  const gov = await prisma.governorate.findFirst({
    where: { id: governorate },
    select: { code: true }
  });

  const govCode = gov?.code.toLowerCase();
  
  if (govCode && defaultTimes[govCode as keyof typeof defaultTimes]) {
    return defaultTimes[govCode as keyof typeof defaultTimes];
  }

  return defaultTimes.default;
};

/**
 * Check if location supports cash on delivery
 */
export const supportsCashOnDelivery = async (
  _governorate: string,
  _center?: string,
  _village?: string
): Promise<boolean> => {
  // For now, all locations support COD
  // In the future, this could be configurable per location
  return true;
};

/**
 * Get shipping providers for location
 */
export const getShippingProviders = async (
  _governorate: string,
  _center?: string,
  _village?: string
): Promise<string[]> => {
  // Default shipping providers
  const providers = ['Soleva Express', 'Aramex', 'Bosta'];
  
  // Could be extended to check provider coverage per location
  return providers;
};
