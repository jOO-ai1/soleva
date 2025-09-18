import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        category: true,
        collection: true,
        variants: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get all categories (public) - must be before /:id route
router.get('/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { 
        parent: true,
        _count: { select: { products: true } } as any 
      }
    } as any);

    const data = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      image: c.image,
      parentId: c.parentId,
      parentName: c.parent ? c.parent.name : null,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      productsCount: c._count?.products || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get all collections (public) - must be before /:id route
router.get('/collections', async (_req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { 
        _count: { select: { products: true } } as any 
      }
    } as any);

    const data = collections.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      image: c.image,
      isActive: c.isActive,
      isFeatured: c.isFeatured,
      sortOrder: c.sortOrder,
      startDate: c.startDate,
      endDate: c.endDate,
      productsCount: c._count?.products || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res): Promise<Response | void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        category: true,
        collection: true,
        variants: true,
        specifications: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

export default router;
