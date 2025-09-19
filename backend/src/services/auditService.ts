import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  adminId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string;
  method?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        adminId: data.adminId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : null,
        newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : null,
        changes: data.oldValues && data.newValues ? JSON.parse(JSON.stringify({ old: data.oldValues, new: data.newValues })) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        endpoint: data.endpoint || null,
        method: data.method || null
      }
    });
  } catch (error) {
















































































































































































    // Don't throw error to avoid breaking the main operation
    // Log error silently in production
  }}; /**
* Get audit logs with filtering and pagination
*/export const getAuditLogs = async (filters: {userId?: string;adminId?: string;action?: string;resource?: string;startDate?: Date;endDate?: Date;page?: number;limit?: number;}) => {const { userId, adminId, action, resource, startDate, endDate, page = 1, limit = 50 } = filters;const skip = (page - 1) * limit;const where: any = {};if (userId) where.userId = userId;if (adminId) where.adminId = adminId;if (action) where.action = action;if (resource) where.resource = resource;if (startDate || endDate) {where.createdAt = {};if (startDate) where.createdAt.gte = startDate;if (endDate) where.createdAt.lte = endDate;}const [logs, total] = await Promise.all([prisma.auditLog.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, admin: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }), prisma.auditLog.count({ where })]);return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };}; /**
* Get audit trail for a specific resource
*/export const getResourceAuditTrail = async (resource: string, resourceId: string) => {return await prisma.auditLog.findMany({ where: { resource, resourceId }, include: { user: { select: { id: true, name: true, email: true } }, admin: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: 'desc' } });}; /**
* Get audit statistics
*/export const getAuditStatistics = async (filters: {startDate?: Date;endDate?: Date;}) => {const { startDate, endDate } = filters;const where: any = {};if (startDate || endDate) {where.createdAt = {};if (startDate) where.createdAt.gte = startDate;if (endDate) where.createdAt.lte = endDate;}const [totalLogs, actionStats, resourceStats, adminStats, dailyStats] = await Promise.all([// Total logs count
    prisma.auditLog.count({ where }), // Actions breakdown
    prisma.auditLog.groupBy({ by: ['action'], where, _count: { action: true }, orderBy: { _count: { action: 'desc' } } }), // Resources breakdown
    prisma.auditLog.groupBy({ by: ['resource'], where, _count: { resource: true }, orderBy: { _count: { resource: 'desc' } } }), // Admin activity
    prisma.auditLog.groupBy({ by: ['adminId'], where: { ...where, adminId: { not: null } }, _count: { adminId: true }, orderBy: { _count: { adminId: 'desc' } } }), // Daily activity (last 30 days)
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ${where.createdAt ? `AND created_at >= ${where.createdAt.gte}` : ''}
      ${where.createdAt?.lte ? `AND created_at <= ${where.createdAt.lte}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `]);
  // Get admin details for admin stats
  const adminIds = adminStats.map((stat: any) => stat.adminId).filter(Boolean);
  const admins = await prisma.user.findMany({
    where: {
      id: { in: adminIds as string[] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  const adminStatsWithDetails = adminStats.map((stat: any) => ({
    ...stat,
    admin: admins.find((admin: any) => admin.id === stat.adminId)
  }));

  return {
    totalLogs,
    actionStats: actionStats.map((stat: any) => ({
      action: stat.action,
      count: stat._count.action
    })),
    resourceStats: resourceStats.map((stat: any) => ({
      resource: stat.resource,
      count: stat._count.resource
    })),
    adminStats: adminStatsWithDetails.map((stat: any) => ({
      adminId: stat.adminId,
      admin: stat.admin,
      count: stat._count.adminId
    })),
    dailyStats
  };
};

/**
 * Clean up old audit logs (for maintenance)
 */
export const cleanupOldAuditLogs = async (daysToKeep: number = 365) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedCount = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  // Log cleanup operation (use proper logging in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cleaned up ${deletedCount.count} audit logs older than ${daysToKeep} days`);
  }
  return deletedCount.count;
};

/**
 * Export audit logs to CSV format
 */
export const exportAuditLogs = async (filters: {
  userId?: string;
  adminId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  // Build where clause without undefined values
  const whereClause: any = {};
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.adminId) whereClause.adminId = filters.adminId;
  if (filters.action) whereClause.action = filters.action;
  if (filters.resource) whereClause.resource = filters.resource;
  if (filters.startDate || filters.endDate) {
    whereClause.createdAt = {};
    if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
    if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      admin: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Convert to CSV format
  const csvHeaders = [
  'Timestamp',
  'Action',
  'Resource',
  'Resource ID',
  'User Name',
  'User Email',
  'Admin Name',
  'Admin Email',
  'Admin Role',
  'IP Address',
  'User Agent'];


  const csvRows = logs.map((log: any) => [
  log.createdAt.toISOString(),
  log.action,
  log.resource,
  log.resourceId || '',
  log.user?.name || '',
  log.user?.email || '',
  log.admin?.name || '',
  log.admin?.email || '',
  log.admin?.role?.toString() || '',
  log.ipAddress || '',
  log.userAgent || '']
  );

  const csvContent = [
  csvHeaders.join(','),
  ...csvRows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))].
  join('\n');

  return csvContent;
};

/**
 * Middleware to automatically create audit logs for API requests
 */
export const auditMiddleware = (resource: string) => {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json;

    res.json = function (body: any) {
      // Only audit successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = getActionFromMethod(req.method);
        const resourceId = req.params.id || body?.data?.id;

        // Create audit log asynchronously
        createAuditLog({
          userId: req.user?.id,
          adminId: req.user?.role !== 'CUSTOMER' ? req.user?.id : undefined,
          action,
          resource,
          resourceId,
          newValues: action === 'CREATE' ? body?.data : undefined,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method
        });
      }

      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Helper function to determine action from HTTP method
 */
const getActionFromMethod = (method: string): AuditLogData['action'] => {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
      return 'VIEW';
    default:
      return 'VIEW';
  }
};

/**
 * Track user login/logout events
 */
export const trackAuthEvent = async (
userId: string,
action: 'LOGIN' | 'LOGOUT',
ipAddress?: string,
userAgent?: string) =>
{
  await createAuditLog({
    userId,
    action,
    resource: 'Authentication',
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  });
};

/**
 * Track sensitive operations
 */
export const trackSensitiveOperation = async (
adminId: string,
operation: string,
details: any,
ipAddress?: string,
userAgent?: string) =>
{
  await createAuditLog({
    adminId,
    action: 'UPDATE',
    resource: 'SensitiveOperation',
    newValues: {
      operation,
      details
    },
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  });
};