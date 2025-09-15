import { Router } from 'express';
import { PrismaClient, PerformanceLevel } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schema for device logging
const deviceLogSchema = z.object({
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  os: z.string(),
  browser: z.string(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  devicePixelRatio: z.number(),
  cpuCores: z.number(),
  memoryGB: z.number().nullable(),
  connectionType: z.string(),
  isLowSpec: z.boolean(),
  performanceLevel: z.enum(['low', 'medium', 'high']),
  adaptiveModeEnabled: z.boolean(),
  fcp: z.number().nullable(),
  lcp: z.number().nullable(),
  inp: z.number().nullable(),
  cls: z.number().nullable(),
  loadTime: z.number(),
  ipAddress: z.string(),
  country: z.string().optional(),
  city: z.string().optional()
});

/**
 * @swagger
 * /api/v1/analytics/device-log:
 *   post:
 *     summary: Log device and performance data
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, tablet, desktop]
 *               os:
 *                 type: string
 *               browser:
 *                 type: string
 *               screenWidth:
 *                 type: number
 *               screenHeight:
 *                 type: number
 *               devicePixelRatio:
 *                 type: number
 *               cpuCores:
 *                 type: number
 *               memoryGB:
 *                 type: number
 *                 nullable: true
 *               connectionType:
 *                 type: string
 *               isLowSpec:
 *                 type: boolean
 *               performanceLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *               adaptiveModeEnabled:
 *                 type: boolean
 *               fcp:
 *                 type: number
 *                 nullable: true
 *               lcp:
 *                 type: number
 *                 nullable: true
 *               inp:
 *                 type: number
 *                 nullable: true
 *               cls:
 *                 type: number
 *                 nullable: true
 *               loadTime:
 *                 type: number
 *               ipAddress:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device data logged successfully
 *       400:
 *         description: Validation error
 */
router.post('/device-log', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const validatedData = deviceLogSchema.parse(req.body);
  
  // Map string performance level to enum
  const performanceLevelMap = {
    'LOW': PerformanceLevel.LOW,
    'MEDIUM': PerformanceLevel.MEDIUM,
    'HIGH': PerformanceLevel.HIGH
  };
  
  const performanceLevel = performanceLevelMap[validatedData.performanceLevel.toUpperCase() as keyof typeof performanceLevelMap];
  
  await prisma.deviceLog.create({
    data: {
      userId: req.user?.userId || null,
      userAgent: req.get('User-Agent') || 'unknown',
      deviceType: validatedData.deviceType,
      os: validatedData.os,
      browser: validatedData.browser,
      screenWidth: validatedData.screenWidth,
      screenHeight: validatedData.screenHeight,
      devicePixelRatio: validatedData.devicePixelRatio,
      cpuCores: validatedData.cpuCores,
      memoryGB: validatedData.memoryGB,
      connectionType: validatedData.connectionType,
      ipAddress: validatedData.ipAddress,
      country: validatedData.country || null,
      city: validatedData.city || null,
      pageLoadTime: validatedData.loadTime,
      fcp: validatedData.fcp,
      lcp: validatedData.lcp,
      inp: validatedData.inp,
      cls: validatedData.cls,
      adaptiveModeEnabled: validatedData.adaptiveModeEnabled,
      performanceLevel
    }
  });

  res.status(201).json({
    success: true,
    message: 'Device data logged successfully'
  });
}));

/**
 * @swagger
 * /api/v1/analytics/device-stats:
 *   get:
 *     summary: Get device analytics statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Device statistics retrieved successfully
 */
router.get('/device-stats', asyncHandler(async (req: any, res: any) => {
  const days = parseInt((req.query?.days as string) || '30') || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    totalLogs,
    deviceTypeStats,
    performanceStats,
    adaptiveModeStats,
    countryStats,
    averageMetrics
  ] = await Promise.all([
    // Total device logs
    prisma.deviceLog.count({
      where: {
        createdAt: { gte: startDate }
      }
    }),

    // Device type breakdown
    prisma.deviceLog.groupBy({
      by: ['deviceType'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        deviceType: true
      }
    }),

    // Performance level breakdown
    prisma.deviceLog.groupBy({
      by: ['performanceLevel'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        performanceLevel: true
      }
    }),

    // Adaptive mode usage
    prisma.deviceLog.groupBy({
      by: ['adaptiveModeEnabled'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        adaptiveModeEnabled: true
      }
    }),

    // Top countries
    prisma.deviceLog.groupBy({
      by: ['country'],
      where: {
        createdAt: { gte: startDate },
        country: { not: null }
      },
      _count: {
        country: true
      },
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 10
    }),

    // Average performance metrics
    prisma.deviceLog.aggregate({
      where: {
        createdAt: { gte: startDate }
      },
      _avg: {
        pageLoadTime: true,
        fcp: true,
        lcp: true,
        inp: true,
        cls: true,
        screenWidth: true,
        screenHeight: true,
        cpuCores: true,
        memoryGB: true
      }
    })
  ]);

  // Calculate percentages
  const deviceTypePercentages = deviceTypeStats.map(stat => ({
    ...stat,
    percentage: ((stat._count.deviceType / totalLogs) * 100).toFixed(1)
  }));

  const performancePercentages = performanceStats.map(stat => ({
    ...stat,
    percentage: ((stat._count.performanceLevel / totalLogs) * 100).toFixed(1)
  }));

  const adaptiveModePercentages = adaptiveModeStats.map(stat => ({
    enabled: stat.adaptiveModeEnabled,
    count: stat._count.adaptiveModeEnabled,
    percentage: ((stat._count.adaptiveModeEnabled / totalLogs) * 100).toFixed(1)
  }));

  res.json({
    success: true,
    data: {
      summary: {
        totalLogs,
        dateRange: {
          startDate,
          endDate: new Date()
        }
      },
      deviceTypes: deviceTypePercentages,
      performanceLevels: performancePercentages,
      adaptiveMode: adaptiveModePercentages,
      topCountries: countryStats,
      averageMetrics: {
        pageLoadTime: Math.round(averageMetrics._avg.pageLoadTime || 0),
        fcp: Math.round(averageMetrics._avg.fcp || 0),
        lcp: Math.round(averageMetrics._avg.lcp || 0),
        inp: Math.round(averageMetrics._avg.inp || 0),
        cls: Number((averageMetrics._avg.cls || 0).toFixed(3)),
        avgScreenWidth: Math.round(averageMetrics._avg.screenWidth || 0),
        avgScreenHeight: Math.round(averageMetrics._avg.screenHeight || 0),
        avgCpuCores: Math.round(averageMetrics._avg.cpuCores || 0),
        avgMemoryGB: Math.round(averageMetrics._avg.memoryGB || 0)
      }
    }
  });
}));

/**
 * @swagger
 * /api/v1/analytics/performance-trends:
 *   get:
 *     summary: Get performance trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Performance trends retrieved successfully
 */
router.get('/performance-trends', asyncHandler(async (req: any, res: any) => {
  const days = parseInt((req.query?.days as string) || '30') || 30;
  
  const trends = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_sessions,
      AVG(page_load_time) as avg_load_time,
      AVG(fcp) as avg_fcp,
      AVG(lcp) as avg_lcp,
      AVG(cls) as avg_cls,
      COUNT(CASE WHEN adaptive_mode_enabled = true THEN 1 END) as adaptive_sessions,
      COUNT(CASE WHEN performance_level = 'LOW' THEN 1 END) as low_performance_sessions
    FROM device_logs 
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  res.json({
    success: true,
    data: trends
  });
}));

/**
 * @swagger
 * /api/v1/analytics/daily-summary:
 *   get:
 *     summary: Get daily analytics summary (for email reports)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily summary retrieved successfully
 */
router.get('/daily-summary', asyncHandler(async (_req: any, res: any) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    dailyStats,
    topDevices,
    performanceIssues,
    newCountries
  ] = await Promise.all([
    // Yesterday's stats
    prisma.deviceLog.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      _count: {
        id: true
      },
      _avg: {
        pageLoadTime: true,
        lcp: true,
        cls: true
      }
    }),

    // Top device types
    prisma.deviceLog.groupBy({
      by: ['deviceType'],
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      _count: {
        deviceType: true
      },
      orderBy: {
        _count: {
          deviceType: 'desc'
        }
      }
    }),

    // Performance issues (slow sessions)
    prisma.deviceLog.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        },
        OR: [
          { pageLoadTime: { gt: 5000 } }, // > 5 seconds
          { lcp: { gt: 4000 } }, // > 4 seconds
          { cls: { gt: 0.25 } } // > 0.25 CLS
        ]
      }
    }),

    // New countries detected
    prisma.deviceLog.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        },
        country: { not: null }
      },
      select: {
        country: true,
        city: true
      },
      distinct: ['country']
    })
  ]);

  const adaptiveModeUsage = await prisma.deviceLog.count({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today
      },
      adaptiveModeEnabled: true
    }
  });

  res.json({
    success: true,
    data: {
      date: yesterday.toISOString().split('T')[0],
      totalSessions: dailyStats._count.id,
      averageLoadTime: Math.round(dailyStats._avg.pageLoadTime || 0),
      averageLCP: Math.round(dailyStats._avg.lcp || 0),
      averageCLS: Number((dailyStats._avg.cls || 0).toFixed(3)),
      adaptiveModeSessions: adaptiveModeUsage,
      adaptiveModePercentage: dailyStats._count.id > 0 
        ? ((adaptiveModeUsage / dailyStats._count.id) * 100).toFixed(1)
        : '0',
      topDeviceTypes: topDevices,
      performanceIssues,
      newCountries: newCountries.map(item => item.country).filter(Boolean),
      insights: generateInsights({
        totalSessions: dailyStats._count.id,
        avgLoadTime: dailyStats._avg.pageLoadTime || 0,
        adaptiveUsage: adaptiveModeUsage,
        performanceIssues,
        topDevice: topDevices[0]?.deviceType || 'unknown'
      })
    }
  });
}));

// Helper function to generate insights
const generateInsights = (data: {
  totalSessions: number;
  avgLoadTime: number;
  adaptiveUsage: number;
  performanceIssues: number;
  topDevice: string;
}) => {
  const insights = [];

  if (data.totalSessions > 0) {
    insights.push(`📊 ${data.totalSessions} user sessions recorded yesterday`);
    
    if (data.avgLoadTime > 3000) {
      insights.push(`⚠️ Average load time is ${Math.round(data.avgLoadTime)}ms - consider optimization`);
    } else {
      insights.push(`✅ Good average load time: ${Math.round(data.avgLoadTime)}ms`);
    }

    if (data.adaptiveUsage > 0) {
      const percentage = ((data.adaptiveUsage / data.totalSessions) * 100).toFixed(1);
      insights.push(`🎯 ${data.adaptiveUsage} sessions (${percentage}%) used adaptive mode`);
    }

    if (data.performanceIssues > 0) {
      insights.push(`🚨 ${data.performanceIssues} sessions had performance issues`);
    }

    insights.push(`📱 Most popular device type: ${data.topDevice}`);
  } else {
    insights.push('📊 No user sessions recorded yesterday');
  }

  return insights;
};

export default router;
