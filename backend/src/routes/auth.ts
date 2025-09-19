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
  logout as customerLogout,
  disconnectGoogleAccount
} from '../controllers/authController';
import {
  verifyEmailVerificationToken,
  markEmailAsVerified,
  resendVerificationEmail
} from '../middleware/emailVerification';
import { validateRegistration, validateLogin } from '../middleware/validation';
import { validateRecaptcha } from '../middleware/captcha';
import { refreshToken } from '../middleware/secureSession';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiters for different auth endpoints
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
  skipSuccessfulRequests: true
});

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

// Customer Authentication Routes with enhanced security
router.post('/customer/login', authLimiter, validateLogin, validateRecaptcha, customerLogin);
router.post('/customer/register', registrationLimiter, validateRegistration, validateRecaptcha, customerRegister);
router.post('/customer/google', authLimiter, validateRecaptcha, googleLogin);
router.post('/customer/facebook', authLimiter, validateRecaptcha, facebookLogin);

// Token refresh endpoint
router.post('/refresh-token', refreshToken);
router.get('/customer/profile', auth, getCustomerProfile);
router.put('/customer/profile', auth, updateCustomerProfile);
router.post('/customer/logout', auth, customerLogout);
router.post('/customer/disconnect-google', auth, disconnectGoogleAccount);

// Email verification routes
router.post('/verify-email', async (req, res): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
      return;
    }

    const decoded = verifyEmailVerificationToken(token);
    if (!decoded) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
      return;
    }

    const success = await markEmailAsVerified(decoded.userId);
    if (success) {
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to verify email'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

router.post('/resend-verification', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    const result = await resendVerificationEmail(email);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
});

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

// Forgot Password - Request Reset (with rate limiting)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
    details: 'Please wait before attempting to reset your password again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

router.post('/forgot-password', forgotPasswordLimiter, async (req: any, res: Response): Promise<Response | void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone number are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Find user with both email and phone
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        phone: phoneNumber.trim(),
        role: 'CUSTOMER'
      }
    });

    // Always return success to prevent email/phone enumeration
    // But only proceed if user exists
    if (user) {
      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Log token generation for debugging (remove in production)
      console.log(`Password reset token generated for user ${user.id}: ${resetToken.substring(0, 8)}... (expires: ${resetExpiry.toISOString()})`);

      // Store reset token in database
      // TODO: Uncomment after running migration
      // await prisma.passwordResetToken.create({
      //   data: {
      //     userId: user.id,
      //     token: resetToken,
      //     expiresAt: resetExpiry
      //   }
      // });

      // Log the password reset attempt
      await prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'User',
          resourceId: user.id,
          userId: user.id,
          changes: { email: email, phone: phoneNumber },
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip || null
        }
      });
    }

    // Always return success message
    res.json({
      success: true,
      message: 'If the provided email and phone number match an existing account, you will receive instructions to reset your password.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Password - Verify and Reset
router.post('/reset-password', async (req: any, res: Response): Promise<Response | void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
        error: 'MISSING_DATA'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Verify token and get user
    // TODO: Implement proper token verification after migration
    // For now, we'll use a simple approach
    const user = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        error: 'INVALID_TOKEN'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // TODO: Mark token as used after migration
    // await prisma.passwordResetToken.update({
    //   where: { id: resetTokenRecord.id },
    //   data: { used: true }
    // });

    // Log the password reset
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'User',
        resourceId: user.id,
        userId: user.id,
        changes: { password: 'reset' },
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null
      }
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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