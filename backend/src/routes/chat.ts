import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  getCurrentConversation,
  createConversation,
  sendMessage,
  getAIResponse,
  requestHumanAgent,
  getConversationMessages,
  uploadChatFile,
  getChatAvailability
} from '../controllers/chatController';
import { auth } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/chat/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Chat Routes
router.post('/conversations/current', getCurrentConversation);
router.post('/conversations', createConversation);
router.post('/messages', sendMessage);
router.post('/ai-response', getAIResponse);
router.post('/request-human', requestHumanAgent);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/upload', upload.single('file'), uploadChatFile);
router.get('/availability', getChatAvailability);

// Admin routes for managing conversations
router.get('/admin/conversations', auth, async (_req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

export default router;
