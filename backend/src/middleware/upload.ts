import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const paymentProofDir = path.join(uploadDir, 'payment-proofs');
const productImagesDir = path.join(uploadDir, 'products');

[uploadDir, paymentProofDir, productImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter function
const fileFilter = (allowedTypes: string[]) => {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = allowedTypes.length > 0 
      ? allowedTypes 
      : (process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  };
};

// Storage configuration for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, paymentProofDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-proof-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for product images
// Unused for now - keeping for future use
/*
const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});
*/

// Memory storage for processing
const memoryStorage = multer.memoryStorage();

// Upload configurations
export const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 1
  }
}).single('paymentProof');

export const uploadProductImages = multer({
  storage: memoryStorage, // Use memory storage for processing
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10 // Maximum 10 images per product
  }
}).array('images', 10);

export const uploadSingleImage = multer({
  storage: memoryStorage,
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 1
  }
}).single('image');

// Image processing middleware
export const processProductImages = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next();
  }

  try {
    const processedImages = [];

    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `product-${uniqueSuffix}.webp`;
      const filepath = path.join(productImagesDir, filename);

      // Process image with Sharp
      await sharp(file.buffer)
        .resize(800, 800, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 85,
          effort: 6 
        })
        .toFile(filepath);

      // Create thumbnail
      const thumbnailFilename = `product-${uniqueSuffix}-thumb.webp`;
      const thumbnailPath = path.join(productImagesDir, thumbnailFilename);

      await sharp(file.buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ 
          quality: 80,
          effort: 6 
        })
        .toFile(thumbnailPath);

      processedImages.push({
        original: `/uploads/products/${filename}`,
        thumbnail: `/uploads/products/${thumbnailFilename}`,
        filename,
        thumbnailFilename,
        size: file.size,
        mimetype: 'image/webp'
      });
    }

    // Attach processed images to request
    (req as any).processedImages = processedImages;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(new ValidationError('Failed to process images'));
  }
};

export const processSingleImage = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `image-${uniqueSuffix}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Process image with Sharp
    await sharp(req.file.buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 85,
        effort: 6 
      })
      .toFile(filepath);

    // Attach processed image to request
    (req as any).processedImage = {
      url: `/uploads/${filename}`,
      filename,
      size: req.file.size,
      mimetype: 'image/webp'
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(new ValidationError('Failed to process image'));
  }
};

// Virus scanning middleware (placeholder for production)
export const scanFile = async (req: Request, _res: Response, next: NextFunction) => {
  // In production, integrate with ClamAV or similar virus scanner
  // For now, just basic file type and size validation
  
  if (req.file) {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (req.file.size > maxSize) {
      throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }
  }

  if (req.files && Array.isArray(req.files)) {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    for (const file of req.files) {
      if (file.size > maxSize) {
        throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
      }
    }
  }

  next();
};

// Clean up temporary files on error
export const cleanupFiles = (files: string[]) => {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file}:`, error);
    }
  });
};

// File validation utilities
export const validateImageFile = (file: Express.Multer.File): boolean => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
  
  return allowedMimeTypes.includes(file.mimetype) && file.size <= maxSize;
};

export const generateSecureFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${timestamp}-${random}${ext}`;
};
