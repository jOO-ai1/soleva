import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface SecureTokenPayload {
  userId: string;
  email: string;
  role: string;
  preferredLanguage: string;
  sessionId: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for token revocation
}

// Generate secure JWT token with additional security features
export const generateSecureToken = (user: {
  id: string;
  email: string;
  role: string;
  preferredLanguage: string;
}): {token: string;refreshToken: string;expiresIn: number;} => {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const jti = `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload: Omit<SecureTokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    sessionId,
    jti
  };

  // Access token (short-lived)
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m', // 15 minutes
    issuer: 'solevaeg.com',
    audience: 'solevaeg.com',
    jwtid: jti
  });

  // Refresh token (longer-lived)
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      sessionId,
      type: 'refresh',
      jti: `refresh_${jti}`
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    {
      expiresIn: '7d', // 7 days
      issuer: 'solevaeg.com',
      audience: 'solevaeg.com'
    }
  );

  return {
    token,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
};

// Verify and refresh token
export const verifyAndRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'TOKEN_REQUIRED'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'solevaeg.com',
      audience: 'solevaeg.com'
    }) as SecureTokenPayload;

    // Check if token is blacklisted (for logout)
    const isBlacklisted = await checkTokenBlacklist(decoded.jti);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        error: 'TOKEN_REVOKED'
      });
      return;
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        preferredLanguage: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is inactive or not found',
        error: 'USER_INACTIVE'
      });
      return;
    }

    // Check if token is close to expiry (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    if (timeUntilExpiry < 300) {// Less than 5 minutes
      // Generate new token
      const newTokens = generateSecureToken(user);

      // Add new token to response headers
      res.setHeader('X-New-Token', newTokens.token);
      res.setHeader('X-New-Refresh-Token', newTokens.refreshToken);
      res.setHeader('X-Token-Expires-In', newTokens.expiresIn.toString());
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      preferredLanguage: user.preferredLanguage
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'TOKEN_INVALID'
      });
      return;
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: 'TOKEN_VERIFICATION_ERROR'
    });
  }
};

// Refresh token endpoint
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token required',
        error: 'REFRESH_TOKEN_REQUIRED'
      });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!, {
      issuer: 'solevaeg.com',
      audience: 'solevaeg.com'
    }) as any;

    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        preferredLanguage: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is inactive or not found',
        error: 'USER_INACTIVE'
      });
      return;
    }

    // Generate new tokens
    const newTokens = generateSecureToken(user);

    res.json({
      success: true,
      token: newTokens.token,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'REFRESH_TOKEN_INVALID'
      });
      return;
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: 'TOKEN_REFRESH_ERROR'
    });
  }
};

// Blacklist token (for logout)
export const blacklistToken = async (jti: string): Promise<void> => {
  try {
    // In a production environment, you would store this in Redis or a database
    // For now, we'll use a simple in-memory store (not suitable for production)
    // TODO: Implement proper token blacklisting with Redis
    console.log(`Token blacklisted: ${jti}`);
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
};

// Check if token is blacklisted
export const checkTokenBlacklist = async (jti: string): Promise<boolean> => {
  try {
    // In a production environment, you would check Redis or database
    // For now, return false (not blacklisted)
    // TODO: Implement proper token blacklist checking with Redis
    console.log(`Checking token blacklist for jti: ${jti}`);
    return false;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false;
  }
};

// Extend Request interface to match auth middleware
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        id: string;
        email: string;
        name: string;
        role: UserRole;
        preferredLanguage: string;
      };
    }
  }
}