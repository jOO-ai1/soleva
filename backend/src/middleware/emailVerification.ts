import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface EmailVerificationToken {
  userId: string;
  email: string;
  purpose: 'email_verification' | 'password_reset';
  iat: number;
  exp: number;
}

// Generate email verification token
export const generateEmailVerificationToken = (userId: string, email: string): string => {
  const payload: Omit<EmailVerificationToken, 'iat' | 'exp'> = {
    userId,
    email,
    purpose: 'email_verification'
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h', // 24 hours for email verification
    issuer: 'solevaeg.com',
    audience: 'solevaeg.com'
  });
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): EmailVerificationToken | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'solevaeg.com',
      audience: 'solevaeg.com'
    }) as EmailVerificationToken;

    if (decoded.purpose !== 'email_verification') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Email verification token error:', error);
    return null;
  }
};

// Mark email as verified
export const markEmailAsVerified = async (userId: string): Promise<boolean> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Error marking email as verified:', error);
    return false;
  }
};

// Check if email is verified
export const isEmailVerified = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    });

    return user?.isVerified || false;
  } catch (error) {
    console.error('Error checking email verification status:', error);
    return false;
  }
};

// Send verification email (placeholder - implement with your email service)
export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<boolean> => {
  try {
    // TODO: Implement actual email sending with your email service
    // This is a placeholder that logs the verification link
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://solevaeg.com'}/verify-email?token=${token}`;

    console.log(`Verification email for ${email}:`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`Name: ${name}`);

    // In production, you would:
    // 1. Use your email service (SendGrid, AWS SES, etc.)
    // 2. Send a properly formatted HTML email
    // 3. Include the verification link
    // 4. Handle email delivery failures

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Resend verification email
export const resendVerificationEmail = async (email: string): Promise<{success: boolean;message: string;}> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return {
        success: false,
        message: 'No account found with this email address'
      };
    }

    if (user.isVerified) {
      return {
        success: false,
        message: 'Email is already verified'
      };
    }

    const token = generateEmailVerificationToken(user.id, user.email);
    const emailSent = await sendVerificationEmail(user.email, token, user.name);

    if (emailSent) {
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } else {
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: 'Internal server error'
    };
  }
};