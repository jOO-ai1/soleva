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
      }
    ],
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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
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
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
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
apiRouter.use('/auth', authLimiter, authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/shipping', shippingRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/orders/track', orderTrackingRoutes); // Public order tracking

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
