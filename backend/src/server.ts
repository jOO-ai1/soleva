import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { auth } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import orderTrackingRoutes from './routes/orderTracking';
import cartRoutes from './routes/cart';
import shippingRoutes from './routes/shipping';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';

// Import services
import { uptimeService } from './services/uptimeService';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Initialize database and Redis
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Soleva E-commerce API',
      version: '1.0.0',
      description: 'Luxury shoe brand e-commerce API for solevaeg.com',
      contact: {
        name: 'Soleva Team',
        email: 'admin@solevaeg.com'
      }
    },
    servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.solevaeg.com' 
        : `http://localhost:${port}`,
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
    }],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middleware with enhanced CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net"],

      scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://accounts.google.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://www.gstatic.com",
      "https://connect.facebook.net",
      "https://cdn.jsdelivr.net"],

      imgSrc: [
      "'self'",
      "data:",
      "https:",
      "blob:",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"],

      connectSrc: [
      "'self'",
      "https://api.solevaeg.com",
      "https://solevaeg.com",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://accounts.google.com",
      "https://www.googletagmanager.com",
      "https://connect.facebook.net",
      "https://graph.facebook.com"],

      fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net"],

      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
      "'self'",
      "https://accounts.google.com",
      "https://www.facebook.com"],

      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
    details: 'Please wait before attempting to authenticate again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Skip failed requests (to avoid double counting)
  skipFailedRequests: false
});

// Enhanced rate limiting for registration (used in auth routes)
const registrationLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX || '3'),
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many registration attempts, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
    details: 'Please wait before attempting to register again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Export for use in auth routes
export { authLimiter, registrationLimiter };

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3002',
  'https://solevaeg.com',
  'https://www.solevaeg.com',
  'https://admin.solevaeg.com',
  'http://solevaeg.com',
  'http://www.solevaeg.com',
  'http://admin.solevaeg.com',
  // Temporary fix for incorrect domain
  'https://solevaeq.com',
  'https://www.solevaeq.com',
  'https://admin.solevaeq.com',
  'http://solevaeq.com',
  'http://www.solevaeq.com',
  'http://admin.solevaeq.com'],

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Apply rate limiting
app.use(limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
const apiRouter = express.Router();

// Public routes (no auth required)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/shipping', shippingRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/orders/track', orderTrackingRoutes); // Public order tracking

// Categories and Collections endpoints
apiRouter.get('/categories', async (_req, res) => {
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
      updatedAt: c.updatedAt
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

apiRouter.get('/collections', async (_req, res) => {
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
      updatedAt: c.updatedAt
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

// Config endpoint - returns public configuration data
apiRouter.get('/config', async (_req, res) => {
  try {
    // Get store settings from database
    let storeSettings = null;
    let integrationSettings = null;

    try {
      storeSettings = await prisma.storeSettings.findFirst();
    } catch (dbError) {
      console.warn('Failed to fetch store settings:', dbError);
      // Continue with default settings
    }

    try {
      integrationSettings = await prisma.integrationSettings.findFirst();
    } catch (dbError) {
      console.warn('Failed to fetch integration settings:', dbError);
      // Continue with default settings
    }

    // Default configuration if no settings found
    const defaultConfig = { 
      store: { 
        name: { en: 'Soleva', ar: 'سوليفا' }, 
        description: { en: 'Luxury Footwear', ar: 'أحذية فاخرة' }, 
        currency: 'EGP', 
        timezone: 'Africa/Cairo', 
        language: 'en',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      },
      features: {
        chatEnabled: process.env.CHAT_SYSTEM_ENABLED === 'true',
        loyaltyProgram: true,
        wishlist: true,
        reviews: true,
        socialLogin: {
          google: !!process.env.GOOGLE_CLIENT_ID,
          facebook: !!process.env.FACEBOOK_APP_ID
        }
      },
      shipping: {
        freeThreshold: parseInt(process.env.SHIPPING_FREE_THRESHOLD || '500'),
        defaultCost: parseInt(process.env.DEFAULT_SHIPPING_COST || '60'),
        currency: 'EGP'
      },
      payment: {
        methods: ['cash_on_delivery', 'bank_transfer'],
        currency: 'EGP'
      },
      analytics: {
        googleAnalytics: process.env.VITE_GA4_MEASUREMENT_ID || '',
        facebookPixel: process.env.VITE_FACEBOOK_PIXEL_ID || ''
      }
    };

    // Merge with database settings if available
    const config = {
      ...defaultConfig,
      store: {
        ...defaultConfig.store,
        ...(storeSettings && {
          name: storeSettings.storeName || defaultConfig.store.name,
          description: storeSettings.storeDescription || defaultConfig.store.description,
          currency: storeSettings.currency || defaultConfig.store.currency,
          timezone: storeSettings.timezone || defaultConfig.store.timezone,
          language: storeSettings.language || defaultConfig.store.language,
          socialMedia: storeSettings.socialMedia || defaultConfig.store.socialMedia
        })
      },
      features: {
        ...defaultConfig.features,
        ...(integrationSettings && {
          socialLogin: {
            google: (integrationSettings.socialLogin as any)?.google?.enabled || defaultConfig.features.socialLogin.google,
            facebook: (integrationSettings.socialLogin as any)?.facebook?.enabled || defaultConfig.features.socialLogin.facebook
          }
        })
      }
    };

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint for API
apiRouter.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStatus = redis.status;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Protected routes (auth required)
apiRouter.use('/cart', auth, cartRoutes);
apiRouter.use('/orders', auth, orderRoutes);
apiRouter.use('/chat', chatRoutes); // Chat has its own auth logic

// Admin routes (admin auth required)
apiRouter.use('/admin', adminRoutes);

// Mount API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRouter);

// Swagger documentation (only in development or if explicitly enabled)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Soleva API Documentation'
  }));
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStatus = redis.status;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Soleva E-commerce API',
    version: '1.0.0',
    docs: process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true' 
      ? '/docs' 
      : 'Documentation not available in production',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      api: `/api/${process.env.API_VERSION || 'v1'}`,
      docs: '/docs',
      health: '/health'
    }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Stop uptime monitoring
  uptimeService.stop();

  // Close database connections
  await prisma.$disconnect();

  // Close Redis connection
  redis.disconnect();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  // Stop uptime monitoring
  uptimeService.stop();

  // Close database connections
  await prisma.$disconnect();

  // Close Redis connection
  redis.disconnect();

  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 Soleva E-commerce API Server is running!

📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${port}
📚 API Docs: http://localhost:${port}/docs
💚 Health Check: http://localhost:${port}/health
📊 API Base: http://localhost:${port}/api/${process.env.API_VERSION || 'v1'}

🛡️  Security: Helmet, CORS, Rate Limiting enabled
📦 Database: PostgreSQL with Prisma ORM
🔄 Cache: Redis for sessions and caching
📝 Logging: Winston with structured logging
  `);

  // Start uptime monitoring if enabled
  uptimeService.start();
});

// Export app for testing
export default app;
export { prisma, redis };