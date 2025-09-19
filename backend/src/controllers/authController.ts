import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import {
  checkAccountLockout 
} from '../middleware/validation';
import {
  generateEmailVerificationToken,
  sendVerificationEmail 
} from '../middleware/emailVerification';
import {
  generateSecureToken 
} from '../middleware/secureSession';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Customer Login
export const customerLogin = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Check account lockout first
    const lockoutCheck = await checkAccountLockout(email);
    if (lockoutCheck.locked) {
      return res.status(401).json({
        success: false,
        message: lockoutCheck.reason || 'Account is locked',
        error: 'ACCOUNT_LOCKED',
        retryAfter: lockoutCheck.retryAfter
      });
    }

    // Find customer user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
        role: 'CUSTOMER'
      }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact support.',
        error: 'ACCOUNT_DISABLED'
      });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        error: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
    }

    // Check password with timing attack protection
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate secure tokens
    const tokens = generateSecureToken({
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage
    });

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Customer Registration
export const customerRegister = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Validate phone number format (E.164 or local format with country code)
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        error: 'PHONE_REQUIRED'
      });
    }

    // Basic phone validation - should start with + or be a valid format
    const phoneRegex = /^(\+?[1-9]\d{1,14}|0[0-9]{10,11})$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        error: 'INVALID_PHONE_FORMAT'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Check if phone number already exists
    const existingPhoneUser = await prisma.user.findFirst({
      where: { phone: phoneNumber.trim() }
    });

    if (existingPhoneUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number already exists',
        error: 'PHONE_ALREADY_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phoneNumber.trim(),
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isVerified: false
      }
    });

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(user.id, user.email);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.name);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      requiresVerification: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Google OAuth Login
export const googleLogin = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
        error: 'MISSING_CREDENTIAL'
      });
    }

    if (typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential format',
        error: 'INVALID_CREDENTIAL_FORMAT'
      });
    }

    // Verify Google token with enhanced validation
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('Google Client ID not configured');
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not properly configured',
        error: 'GOOGLE_CONFIG_ERROR'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token',
        error: 'INVALID_GOOGLE_TOKEN'
      });
    }

    const { sub: googleId, email, name, picture, email_verified, iss, aud, exp } = payload;

    // Validate token issuer
    if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token issuer',
        error: 'INVALID_TOKEN_ISSUER'
      });
    }

    // Validate audience
    if (aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token audience',
        error: 'INVALID_TOKEN_AUDIENCE'
      });
    }

    // Check token expiration
    if (exp && exp < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google',
        error: 'EMAIL_NOT_PROVIDED'
      });
    }

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email is not verified',
        error: 'EMAIL_NOT_VERIFIED'
      });
    }

    if (!googleId) {
      return res.status(400).json({
        success: false,
        message: 'Google ID not provided',
        error: 'GOOGLE_ID_NOT_PROVIDED'
      });
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
        { email },
        { googleId }]
      }
    });

    if (user) {
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is disabled. Please contact support.',
          error: 'ACCOUNT_DISABLED'
        });
      }

      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar: picture || user.avatar,
            isVerified: true, // Google emails are pre-verified
            emailVerifiedAt: new Date(),
            lastLoginAt: new Date()
          }
        });
      } else {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0] || 'User',
          email: email.toLowerCase().trim(),
          googleId,
          avatar: picture || null,
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true, // Google emails are pre-verified
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date()
        }
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Generate secure tokens
    const tokens = generateSecureToken({
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage
    });

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Facebook OAuth Login
export const facebookLogin = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // Check if Facebook login is enabled
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET ||
    process.env.FACEBOOK_APP_ID.trim() === '' || process.env.FACEBOOK_APP_SECRET.trim() === '') {
      return res.status(503).json({
        success: false,
        message: 'Facebook login is temporarily disabled'
      });
    }

    const { accessToken, userID } = req.body;

    if (!accessToken || !userID) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token and user ID are required'
      });
    }

    // Verify Facebook token
    const response = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name,email,picture`);
    const facebookData = response.data;

    if (facebookData.id !== userID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook token'
      });
    }

    const { id: facebookId, email, name, picture } = facebookData;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Facebook'
      });
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
        { email },
        { facebookId }]
      }
    });

    if (user) {
      // Update Facebook ID if not set
      if (!user.facebookId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId,
            avatar: picture?.data?.url || user.avatar,
            lastLoginAt: new Date()
          }
        });
      } else {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0] || 'User',
          email,
          facebookId,
          avatar: picture?.data?.url || null,
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true, // Facebook users are considered verified
          lastLoginAt: new Date()
        }
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Generate secure tokens
    const tokens = generateSecureToken({
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage
    });

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer profile
export const getCustomerProfile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        preferredLanguage: true,
        isVerified: true,
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
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { name, phone, avatar, preferredLanguage } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validate language preference
    if (preferredLanguage && !['en', 'ar'].includes(preferredLanguage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language preference. Must be "en" or "ar"'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
        isVerified: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout
export const logout = async (_req: Request, res: Response): Promise<Response | void> => {
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
};

// Disconnect Google Account
export const disconnectGoogleAccount = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'UNAUTHORIZED'
      });
    }

    // Find user and check if they have a Google account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        googleId: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'No Google account connected',
        error: 'NO_GOOGLE_ACCOUNT'
      });
    }

    // Remove Google ID from user account
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null
        // Optionally remove avatar if it was from Google
        // avatar: user.avatar?.includes('googleusercontent.com') ? null : user.avatar
      }
    });

    res.json({
      success: true,
      message: 'Google account disconnected successfully'
    });

  } catch (error) {
    console.error('Google account disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};