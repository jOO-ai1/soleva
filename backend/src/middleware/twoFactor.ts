import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AuthenticatedRequest } from './auth';

const prisma = new PrismaClient();

interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// interface TwoFactorVerificationRequest {
//   token: string;
//   backupCode?: string;
// }

// Validate TOTP token
export const validateTwoFactor = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
};

// Generate 2FA secret with QR code
export const generateTwoFactorSecret = (email: string) => {
  const secret = speakeasy.generateSecret({
    name: email,
    issuer: process.env.TOTP_ISSUER || 'Soleva Admin'
  });

  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!,
    backupCodes
  };
};

// Generate backup codes
export const generateBackupCodes = (): string[] => {
  return Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
};

// Generate 2FA secret and QR code
export const generate2FASecret = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Only allow admin roles to enable 2FA
    if (!['ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can enable 2FA'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Soleva Admin (${user.email})`,
      issuer: 'Soleva E-commerce',
      length: 32
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not activated until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: backupCodes,
        twoFactorEnabled: false // Will be enabled after verification
      }
    });

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32
      } as TwoFactorSetupResponse
    });

  } catch (error) {
    console.error('2FA secret generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate 2FA secret'
    });
  }
};

// Verify and enable 2FA
export const enable2FA = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { token }: { token: string } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Get user with 2FA secret
    const userWithSecret = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true
      }
    });

    if (!userWithSecret?.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA secret not found. Please generate a new secret.'
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: userWithSecret.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ENABLE_2FA',
        resource: 'USER',
        resourceId: user.id
      }
    });

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
};

// Disable 2FA
export const disable2FA = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { token, password }: { token?: string; password: string } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    // Verify password
    const bcrypt = require('bcrypt');
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
        twoFactorSecret: true,
        twoFactorEnabled: true
      }
    });

    if (!userWithPassword || !await bcrypt.compare(password, userWithPassword.password)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // If 2FA is currently enabled, require token verification
    if (userWithPassword.twoFactorEnabled && userWithPassword.twoFactorSecret) {
      if (!token) {
        return res.status(400).json({
          success: false,
          message: '2FA token is required'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: userWithPassword.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA token'
        });
      }
    }

    // Disable 2FA and clear secrets
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DISABLE_2FA',
        resource: 'USER',
        resourceId: user.id
      }
    });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
};

// Verify 2FA token during login
export const verify2FAToken = async (
  userId: string, 
  token: string, 
  backupCode?: string
): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        backupCodes: true
      }
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return true; // 2FA not enabled, allow access
    }

    // Try backup code first if provided
    if (backupCode && user.backupCodes) {
      const backupCodes = user.backupCodes;
      const codeIndex = backupCodes.findIndex(code => code === backupCode.toUpperCase());
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: backupCodes
          }
        });
        
        // Log backup code usage
        await prisma.auditLog.create({
          data: {
            userId: userId,
            action: 'USE_2FA_BACKUP_CODE',
            resource: 'USER',
            resourceId: userId
          }
        });
        
        return true;
      }
    }

    // Verify TOTP token
    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (verified) {
        // Log successful 2FA verification
        await prisma.auditLog.create({
          data: {
            userId: userId,
            action: 'VERIFY_2FA_SUCCESS',
            resource: 'USER',
            resourceId: userId
          }
        });
        
        return true;
      }
    }

    // Log failed 2FA attempt
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'VERIFY_2FA_FAILED',
        resource: 'USER',
        resourceId: userId
      }
    });

    return false;

  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
};

// Middleware to require 2FA for protected routes
export const require2FA = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user has 2FA enabled
    const userWith2FA = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        role: true
      }
    });

    // Require 2FA for admin users
    if (['ADMIN', 'OWNER', 'MANAGER'].includes(user.role) && !userWith2FA?.twoFactorEnabled) {
      return res.status(403).json({
        success: false,
        message: '2FA is required for admin users',
        requiresSetup: true
      });
    }

    next();

  } catch (error) {
    console.error('2FA requirement check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA requirement'
    });
  }
};

// Get 2FA status
export const get2FAStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userWith2FA = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        backupCodes: true
      }
    });

    const backupCodesCount = userWith2FA?.backupCodes 
      ? userWith2FA.backupCodes.length 
      : 0;

    res.json({
      success: true,
      data: {
        enabled: userWith2FA?.twoFactorEnabled || false,
        backupCodesRemaining: backupCodesCount,
        isRequired: ['ADMIN', 'OWNER', 'MANAGER'].includes(user.role)
      }
    });

  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
};

// Generate new backup codes
export const generateNewBackupCodes = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { token }: { token: string } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '2FA token is required'
      });
    }

    // Verify current 2FA token
    const verified = await verify2FAToken(user.id, token);
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        backupCodes: backupCodes
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GENERATE_2FA_BACKUP_CODES',
        resource: 'USER',
        resourceId: user.id
      }
    });

    res.json({
      success: true,
      data: {
        backupCodes: backupCodes
      }
    });

  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate backup codes'
    });
  }
};
