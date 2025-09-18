import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get governorates
router.get('/governorates', async (_req, res) => {
  try {
    const governorates = await prisma.governorate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: governorates
    });
  } catch (error) {
    console.error('Governorates fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch governorates'
    });
  }
});

// Get centers by governorate
router.get('/centers/:governorateId', async (req, res) => {
  try {
    const centers = await prisma.centers.findMany({
      where: {
        governorateId: req.params.governorateId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: centers
    });
  } catch (error) {
    console.error('Centers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch centers'
    });
  }
});

// Get villages by center
router.get('/villages/:centerId', async (req, res) => {
  try {
    const villages = await prisma.village.findMany({
      where: {
        centerId: req.params.centerId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: villages
    });
  } catch (error) {
    console.error('Villages fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch villages'
    });
  }
});

// Calculate shipping cost
router.post('/calculate', async (req, res) => {
  try {
    const { governorateId, centerId, villageId, orderTotal } = req.body;

    // Get shipping rate
    const shippingRate = await prisma.shippingRate.findFirst({
      where: {
        OR: [
        { villageId: villageId },
        { centerId: centerId },
        { governorateId: governorateId }],

        isActive: true,
        effectiveFrom: { lte: new Date() },
        AND: [
        {
          OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }]

        }]

      },
      orderBy: [
      { villageId: 'desc' },
      { centerId: 'desc' },
      { governorateId: 'desc' }]

    });

    let cost = 0;
    if (shippingRate) {
      cost = Number(shippingRate.cost);

      // Check for free shipping
      if (shippingRate.freeThreshold && orderTotal >= Number(shippingRate.freeThreshold)) {
        cost = 0;
      }
    }

    res.json({
      success: true,
      data: {
        cost,
        isFree: cost === 0,
        threshold: shippingRate?.freeThreshold ? Number(shippingRate.freeThreshold) : null
      }
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping cost'
    });
  }
});

export default router;