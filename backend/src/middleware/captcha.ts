import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface CaptchaValidationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

// Google reCAPTCHA v3 validation
export const validateRecaptcha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recaptcha_token } = req.body;
    
    // Skip CAPTCHA validation if secret key is not configured
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey || secretKey.trim() === '') {
      console.warn('reCAPTCHA secret key not configured, skipping validation');
      next();
      return;
    }
    
    // Skip CAPTCHA validation in development if token is not provided
    if (process.env.NODE_ENV === 'development' && !recaptcha_token) {
      next();
      return;
    }
    
    if (!recaptcha_token) {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification is required',
        error: 'CAPTCHA_REQUIRED'
      });
      return;
    }
    
    // Verify with Google reCAPTCHA
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: secretKey,
        response: recaptcha_token,
        remoteip: req.ip || req.connection.remoteAddress
      },
      timeout: 5000
    });
    
    const result: CaptchaValidationResult = response.data;
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed',
        error: 'CAPTCHA_FAILED',
        details: result['error-codes'] || ['Unknown error']
      });
      return;
    }
    
    // Check score for reCAPTCHA v3 (0.0 to 1.0, higher is better)
    if (result.score !== undefined && result.score < 0.5) {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed - suspicious activity detected',
        error: 'CAPTCHA_LOW_SCORE',
        score: result.score
      });
      return;
    }
    
    // Store CAPTCHA result in request for logging
    req.captchaResult = result;
    next();
  } catch (error) {
    console.error('CAPTCHA validation error:', error);
    
    // In case of network error, allow request to proceed with warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('CAPTCHA validation failed, allowing request in development');
      next();
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'CAPTCHA verification service unavailable',
      error: 'CAPTCHA_SERVICE_ERROR'
    });
  }
};

// hCaptcha validation (alternative to reCAPTCHA)
export const validateHcaptcha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hcaptcha_token } = req.body;
    
    if (!hcaptcha_token) {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification is required',
        error: 'CAPTCHA_REQUIRED'
      });
      return;
    }
    
    const secretKey = process.env.HCAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn('hCaptcha secret key not configured, skipping validation');
      next();
      return;
    }
    
    // Verify with hCaptcha
    const response = await axios.post('https://hcaptcha.com/siteverify', null, {
      params: {
        secret: secretKey,
        response: hcaptcha_token,
        remoteip: req.ip || req.connection.remoteAddress
      },
      timeout: 5000
    });
    
    const result = response.data;
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed',
        error: 'CAPTCHA_FAILED',
        details: result['error-codes'] || ['Unknown error']
      });
      return;
    }
    
    // Store CAPTCHA result in request for logging
    req.captchaResult = result;
    next();
  } catch (error) {
    console.error('hCaptcha validation error:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('hCaptcha validation failed, allowing request in development');
      next();
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'CAPTCHA verification service unavailable',
      error: 'CAPTCHA_SERVICE_ERROR'
    });
  }
};

// Extend Request interface to include CAPTCHA result
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      captchaResult?: CaptchaValidationResult;
    }
  }
}
