import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    id: string;
    email: string;
    name: string;
    role: UserRole;
    preferredLanguage: string;
  };
}

export const auth = async (
req: Request,
res: Response,
next: NextFunction)
: Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
      return;
    }

    interface JwtPayload {
      userId: string;
      email: string;
      iat: number;
      exp: number;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or deactivated user'
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    (req as AuthenticatedRequest).user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      preferredLanguage: user.preferredLanguage || 'en'
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([
UserRole.ADMIN,
UserRole.OWNER]
);

export const requireManager = requireRole([
UserRole.MANAGER,
UserRole.ADMIN,
UserRole.OWNER]
);

export const requireSupport = requireRole([
UserRole.SUPPORT,
UserRole.CONTENT,
UserRole.MANAGER,
UserRole.ADMIN,
UserRole.OWNER]
);

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
req: AuthenticatedRequest,
_res: Response,
next: NextFunction)
: Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      (req as AuthenticatedRequest).user = {
        ...user,
        userId: user.id,
        preferredLanguage: user.preferredLanguage || 'en'
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};