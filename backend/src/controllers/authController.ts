import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Customer Login
export const customerLogin = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find customer user
    const user = await prisma.user.findUnique({
      where: { 
        email,
        role: 'CUSTOMER'
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
      { expiresIn: '7d' }
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
    const { name, email, password, password_confirmation } = req.body;

    if (!name || !email || !password || !password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        isVerified: false
      }
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
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
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
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID as string
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google'
      });
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      }
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId,
            avatar: picture || user.avatar,
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
          googleId,
          avatar: picture || null,
          role: 'CUSTOMER',
          isActive: true,
          isVerified: true, // Google users are considered verified
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

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
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
          { facebookId }
        ]
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

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
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
