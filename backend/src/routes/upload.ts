import { Router } from 'express';
import { uploadPaymentProof, uploadSingleImage, processSingleImage, scanFile } from '../middleware/upload';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/upload/payment-proof/{orderId}:
 *   post:
 *     summary: Upload payment proof for an order
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *                 description: Payment proof image (JPG, PNG, WebP, HEIC)
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     url:
 *                       type: string
 *                     size:
 *                       type: number
 *       400:
 *         description: Validation error or file upload failed
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Order not found
 */
router.post('/payment-proof/:orderId',
auth,
scanFile,
uploadPaymentProof,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  const { orderId } = req.params;
  const userId = req.user!.id;

  if (!req.file) {
    throw new ValidationError('Payment proof file is required');
  }

  // Verify order belongs to user and requires payment proof
  const order = await prisma.order.findFirst({
    where: {
      id: orderId || '',
      userId,
      paymentMethod: { in: ['BANK_WALLET', 'DIGITAL_WALLET'] },
      paymentStatus: { in: ['AWAITING_PROOF', 'UNDER_REVIEW'] }
    }
  });

  if (!order) {
    throw new ValidationError('Order not found or payment proof not required');
  }

  // Update order with payment proof URL
  await prisma.order.update({
    where: { id: orderId || '' },
    data: {
      paymentProofUrl: req.file.path,
      paymentStatus: 'UNDER_REVIEW'
    }
  });

  // Add timeline entry
  await prisma.orderTimeline.create({
    data: {
      orderId: orderId || '',
      status: 'PAYMENT_PROOF_UPLOADED',
      description: {
        ar: 'تم رفع إثبات الدفع',
        en: 'Payment proof uploaded'
      }
    }
  });

  res.json({
    success: true,
    message: 'Payment proof uploaded successfully',
    data: {
      filename: req.file.filename,
      url: `/uploads/payment-proofs/${req.file.filename}`,
      size: req.file.size
    }
  });
})
);

/**
 * @swagger
 * /api/v1/upload/image:
 *   post:
 *     summary: Upload a single image (general purpose)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     url:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimetype:
 *                       type: string
 *       400:
 *         description: Validation error or file upload failed
 *       401:
 *         description: Authentication required
 */
router.post('/image',
auth,
scanFile,
uploadSingleImage,
processSingleImage,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const processedImage = (req as any).processedImage;

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: processedImage
  });
})
);

/**
 * @swagger
 * /api/v1/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *       400:
 *         description: Validation error or file upload failed
 *       401:
 *         description: Authentication required
 */
router.post('/avatar',
auth,
scanFile,
uploadSingleImage,
processSingleImage,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  const userId = req.user!.id;

  if (!req.file) {
    throw new ValidationError('Avatar file is required');
  }

  const processedImage = (req as any).processedImage;

  // Update user avatar
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: processedImage.url }
  });

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatarUrl: processedImage.url
    }
  });
})
);

/**
 * @swagger
 * /api/v1/upload/validate:
 *   post:
 *     summary: Validate file before upload (check size, type, etc.)
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               size:
 *                 type: number
 *               mimetype:
 *                 type: string
 *     responses:
 *       200:
 *         description: File validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
/**
 * @swagger
 * /api/v1/upload/product:
 *   post:
 *     summary: Upload product image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Product image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 */
router.post('/product',
auth,
scanFile,
uploadSingleImage,
processSingleImage,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const processedImage = (req as any).processedImage;

  res.json({
    success: true,
    message: 'Product image uploaded successfully',
    data: processedImage
  });
})
);

/**
 * @swagger
 * /api/v1/upload/category:
 *   post:
 *     summary: Upload category image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Category image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 */
router.post('/category',
auth,
scanFile,
uploadSingleImage,
processSingleImage,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const processedImage = (req as any).processedImage;

  res.json({
    success: true,
    message: 'Category image uploaded successfully',
    data: processedImage
  });
})
);

/**
 * @swagger
 * /api/v1/upload/flash-sale:
 *   post:
 *     summary: Upload flash sale banner image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Flash sale banner image file (JPG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Flash sale banner uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 */
router.post('/flash-sale',
auth,
scanFile,
uploadSingleImage,
processSingleImage,
asyncHandler(async (req: AuthenticatedRequest, res: any): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const processedImage = (req as any).processedImage;

  res.json({
    success: true,
    message: 'Flash sale banner uploaded successfully',
    data: processedImage
  });
})
);

router.post('/validate', asyncHandler(async (req: any, res: any) => {
  const { filename, size, mimetype } = req.body;
  const errors: string[] = [];

  // Validate file type
  const allowedMimeTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedMimeTypes.includes(mimetype)) {
    errors.push(`File type ${mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Validate file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
  if (size > maxSize) {
    errors.push(`File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`);
  }

  // Validate filename
  if (!filename || filename.length === 0) {
    errors.push('Filename is required');
  }

  const valid = errors.length === 0;

  res.json({
    success: true,
    valid,
    errors: valid ? undefined : errors
  });
}));

export default router;