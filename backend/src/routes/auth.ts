import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { validateTwoFactor, generateTwoFactorSecret, generateBackupCodes } from '../middleware/twoFactor';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  customerLogin, 
  customerRegister, 
  googleLogin, 
  facebookLogin, 
  getCustomerProfile, 
  updateCustomerProfile, 
  logout as customerLogout 
} from '../controllers/authController';

const router = express.Router();
const prisma = new PrismaClient();

// Customer Authentication Routes
router.post('/customer/login', customerLogin);
router.post('/customer/register', customerRegister);
router.post('/customer/google', googleLogin);
router.post('/customer/facebook', facebookLogin);
router.get('/customer/profile', auth, getCustomerProfile);
router.put('/customer/profile', auth, updateCustomerProfile);
router.post('/customer/logout', auth, customerLogout);

// Admin Login
router.post('/admin/login', async (req, res): Promise<Response | void> => {
  try {
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { 
        email,
        role: { in: ['ADMIN', 'OWNER', 'MANAGER', 'CONTENT', 'SUPPORT'] }
      }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Two-factor authentication required'
        });
      }

      const isValidToken = validateTwoFactor(user.twoFactorSecret!, twoFactorToken);
      if (!isValidToken) {
        // Check backup codes
        const backupCodeIndex = user.backupCodes.indexOf(twoFactorToken);
        if (backupCodeIndex === -1) {
          return res.status(401).json({
            success: false,
            message: 'Invalid two-factor authentication code'
          });
        }

        // Remove used backup code
        const updatedBackupCodes = user.backupCodes.filter((_, index) => index !== backupCodeIndex);
        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: updatedBackupCodes }
        });
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        preferredLanguage: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const { name, phone, avatar, preferredLanguage } = req.body;

    // Validate language preference
    if (preferredLanguage && !['en', 'ar'].includes(preferredLanguage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language preference. Must be "en" or "ar"'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(preferredLanguage && { preferredLanguage })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        preferredLanguage: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        resource: 'User',
        resourceId: updatedUser.id,
        userId: req.user!.userId,
        adminId: req.user!.userId,
        changes: {
          ...(name && { name: { from: req.user!.name, to: name } }),
          ...(phone !== undefined && { phone }),
          ...(avatar !== undefined && { avatar }),
          ...(preferredLanguage && { preferredLanguage })
        },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/password', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'CHANGE_PASSWORD',
        resource: 'User',
        resourceId: user.id,
        userId: req.user!.userId,
        adminId: req.user!.userId,
        changes: { password: 'changed' },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable 2FA
router.post('/2fa/enable', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already enabled'
      });
    }

    // Generate secret and QR code
    const { secret, qrCodeUrl, backupCodes } = generateTwoFactorSecret(user.email);

    // Store secret temporarily (not enabled until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        backupCodes: backupCodes
      }
    });

    res.json({
      success: true,
      qrCodeUrl,
      backupCodes,
      message: 'Scan the QR code and verify to enable 2FA'
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify and activate 2FA
router.post('/2fa/verify', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication setup not found'
      });
    }

    // Verify token
    const isValid = validateTwoFactor(user.twoFactorSecret, token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'ENABLE_2FA',
        resource: 'User',
        resourceId: user.id,
        userId: req.user!.userId,
        adminId: req.user!.userId,
        changes: { twoFactorEnabled: true },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });

  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Disable 2FA
router.post('/2fa/disable', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
      }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'DISABLE_2FA',
        resource: 'User',
        resourceId: user.id,
        userId: req.user!.userId,
        adminId: req.user!.userId,
        changes: { twoFactorEnabled: false },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate new backup codes
router.post('/2fa/backup-codes', auth, async (req: AuthenticatedRequest, res): Promise<Response | void> => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to generate new backup codes'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'GENERATE_BACKUP_CODES',
        resource: 'User',
        resourceId: user.id,
        userId: req.user!.userId,
        adminId: req.user!.userId,
        changes: { backupCodes: 'regenerated' },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      backupCodes,
      message: 'New backup codes generated successfully'
    });

  } catch (error) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (if using token blacklisting)
router.post('/logout', auth, async (_req, res) => {
  try {
    // In a real implementation, you might want to blacklist the JWT token
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
