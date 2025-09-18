import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password requirements - Enhanced for production security
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  requireNoCommonPatterns: true,
  requireNoPersonalInfo: true
};

// Common password list (basic protection)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
  'shadow', 'superman', 'qazwsx', 'michael', 'football', 'baseball'
];

export interface ValidationErrorItem {
  field: string;
  message: string;
  code: string;
}

export class ValidationError extends Error {
  public errors: ValidationErrorItem[];
  
  constructor(errors: ValidationErrorItem[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

// Email validation
export const validateEmail = (email: string): ValidationErrorItem[] => {
  const errors: ValidationErrorItem[] = [];
  
  if (!email) {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'EMAIL_REQUIRED'
    });
    return errors;
  }
  
  if (typeof email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email must be a string',
      code: 'EMAIL_INVALID_TYPE'
    });
    return errors;
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    errors.push({
      field: 'email',
      message: 'Email cannot be empty',
      code: 'EMAIL_EMPTY'
    });
    return errors;
  }
  
  if (trimmedEmail.length > 254) {
    errors.push({
      field: 'email',
      message: 'Email is too long (maximum 254 characters)',
      code: 'EMAIL_TOO_LONG'
    });
    return errors;
  }
  
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.push({
      field: 'email',
      message: 'Email format is invalid',
      code: 'EMAIL_INVALID_FORMAT'
    });
    return errors;
  }
  
  return errors;
};

// Name validation
export const validateName = (name: string): ValidationErrorItem[] => {
  const errors: ValidationErrorItem[] = [];
  
  if (!name) {
    errors.push({
      field: 'name',
      message: 'Name is required',
      code: 'NAME_REQUIRED'
    });
    return errors;
  }
  
  if (typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string',
      code: 'NAME_INVALID_TYPE'
    });
    return errors;
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    errors.push({
      field: 'name',
      message: 'Name cannot be empty',
      code: 'NAME_EMPTY'
    });
    return errors;
  }
  
  if (trimmedName.length < 2) {
    errors.push({
      field: 'name',
      message: 'Name must be at least 2 characters long',
      code: 'NAME_TOO_SHORT'
    });
    return errors;
  }
  
  if (trimmedName.length > 100) {
    errors.push({
      field: 'name',
      message: 'Name is too long (maximum 100 characters)',
      code: 'NAME_TOO_LONG'
    });
    return errors;
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\u0600-\u06FF\s\-']+$/.test(trimmedName)) {
    errors.push({
      field: 'name',
      message: 'Name contains invalid characters',
      code: 'NAME_INVALID_CHARS'
    });
    return errors;
  }
  
  return errors;
};

// Password validation
export const validatePassword = (password: string): ValidationErrorItem[] => {
  const errors: ValidationErrorItem[] = [];
  
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
      code: 'PASSWORD_REQUIRED'
    });
    return errors;
  }
  
  if (typeof password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password must be a string',
      code: 'PASSWORD_INVALID_TYPE'
    });
    return errors;
  }
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
      code: 'PASSWORD_TOO_SHORT'
    });
  }
  
  if (password.length > 128) {
    errors.push({
      field: 'password',
      message: 'Password is too long (maximum 128 characters)',
      code: 'PASSWORD_TOO_LONG'
    });
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
      code: 'PASSWORD_NO_UPPERCASE'
    });
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
      code: 'PASSWORD_NO_LOWERCASE'
    });
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
      code: 'PASSWORD_NO_NUMBER'
    });
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character',
      code: 'PASSWORD_NO_SPECIAL'
    });
  }
  
  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push({
      field: 'password',
      message: 'Password is too common, please choose a stronger password',
      code: 'PASSWORD_TOO_COMMON'
    });
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password cannot contain more than 2 consecutive identical characters',
      code: 'PASSWORD_REPEATED_CHARS'
    });
  }
  
  // Check for common patterns
  if (PASSWORD_REQUIREMENTS.requireNoCommonPatterns) {
    // Sequential characters (123, abc, etc.)
    if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password cannot contain sequential characters',
        code: 'PASSWORD_SEQUENTIAL_CHARS'
      });
    }
    
    // Keyboard patterns
    if (/qwerty|asdfgh|zxcvbn|qazwsx|edcrfv|rfvtgb|tgbyhn|yhnujm|ikm|olp|p;/i.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password cannot contain keyboard patterns',
        code: 'PASSWORD_KEYBOARD_PATTERN'
      });
    }
  }
  
  // Check for personal information patterns (basic check)
  if (PASSWORD_REQUIREMENTS.requireNoPersonalInfo) {
    // Check for common personal info patterns
    const personalPatterns = [
      /(19|20)\d{2}/, // Years
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
    ];
    
    for (const pattern of personalPatterns) {
      if (pattern.test(password)) {
        errors.push({
          field: 'password',
          message: 'Password should not contain personal information like dates or names',
          code: 'PASSWORD_PERSONAL_INFO'
        });
        break;
      }
    }
  }
  
  return errors;
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    return !!user;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
};

// Registration validation middleware
export const validateRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, password_confirmation } = req.body;
    const errors: ValidationErrorItem[] = [];
    
    // Validate name
    errors.push(...validateName(name));
    
    // Validate email
    errors.push(...validateEmail(email));
    
    // Validate password
    errors.push(...validatePassword(password));
    
    // Check password confirmation
    if (!password_confirmation) {
      errors.push({
        field: 'password_confirmation',
        message: 'Password confirmation is required',
        code: 'PASSWORD_CONFIRMATION_REQUIRED'
      });
    } else if (password !== password_confirmation) {
      errors.push({
        field: 'password_confirmation',
        message: 'Password confirmation does not match',
        code: 'PASSWORD_CONFIRMATION_MISMATCH'
      });
    }
    
    // Check if email already exists
    if (email && !errors.some(e => e.field === 'email')) {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        errors.push({
          field: 'email',
          message: 'An account with this email already exists',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }
    
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
      return;
    }
    
    // Sanitize and normalize data
    req.body.name = name.trim();
    req.body.email = email.toLowerCase().trim();
    
    next();
  } catch (error) {
    console.error('Registration validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
    return;
  }
};

// Login validation middleware
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { email, password } = req.body;
    const errors: ValidationErrorItem[] = [];
    
    // Validate email
    errors.push(...validateEmail(email));
    
    // Basic password validation for login
    if (!password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
        code: 'PASSWORD_REQUIRED'
      });
    } else if (typeof password !== 'string') {
      errors.push({
        field: 'password',
        message: 'Password must be a string',
        code: 'PASSWORD_INVALID_TYPE'
      });
    }
    
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
      return;
    }
    
    // Sanitize email
    req.body.email = email.toLowerCase().trim();
    
    next();
  } catch (error) {
    console.error('Login validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
    return;
  }
};

// Rate limiting with clear error messages and exponential backoff
export const createRateLimitError = (retryAfter: number, attemptCount: number = 0) => {
  const baseMessage = 'Too many authentication attempts. Please try again later.';
  const retryMessage = retryAfter > 0 ? ` Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.` : '';
  
  // Progressive messaging based on attempt count
  let severityMessage = '';
  if (attemptCount >= 10) {
    severityMessage = ' Your account may be temporarily locked for security reasons.';
  } else if (attemptCount >= 5) {
    severityMessage = ' Please consider using the "Forgot Password" feature if you cannot remember your credentials.';
  }
  
  return {
    success: false,
    message: baseMessage + retryMessage + severityMessage,
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: retryAfter,
    attemptCount: attemptCount,
    details: 'Please wait before attempting to authenticate again.',
    suggestions: attemptCount >= 5 ? [
      'Use the "Forgot Password" feature',
      'Check your email for any account notifications',
      'Contact support if you continue to have issues'
    ] : []
  };
};

// Account lockout check
export const checkAccountLockout = async (email: string): Promise<{ locked: boolean; reason?: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    if (!user) {
      return { locked: false };
    }
    
    // Check if account is suspended
    if (!user.isActive) {
      return { 
        locked: true, 
        reason: 'Account is suspended. Please contact support.' 
      };
    }
    
    // Check for recent failed attempts (implement if needed)
    // This would require a failed_attempts table or similar
    
    return { locked: false };
  } catch (error) {
    console.error('Account lockout check error:', error);
    return { locked: false };
  }
};
