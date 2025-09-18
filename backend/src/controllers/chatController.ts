import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get or create current conversation
export const getCurrentConversation = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { customerName, customerEmail } = req.body;

    // Find existing open conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
        ...(userId ? [{ userId, status: 'OPEN' as const }] : []),
        ...(customerEmail ? [{ customerEmail, status: 'OPEN' as const }] : [])]

      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          userId: userId || null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          source: 'WEBSITE',
          status: 'OPEN',
          priority: 'NORMAL'
        },
        include: {
          messages: true
        }
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Get current conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// Create new conversation
export const createConversation = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { source = 'WEBSITE', customerName, customerEmail, subject } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId: userId || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        subject: subject || null,
        source: source as any,
        status: 'OPEN',
        priority: 'NORMAL'
      }
    });

    res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId, content, type = 'TEXT' } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and content are required'
      });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        type: type as any,
        senderId: userId || null,
        senderType: userId ? 'CUSTOMER' : 'CUSTOMER',
        senderName: userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.name || null : 'Guest'
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Get AI response
export const getAIResponse = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId, message, language = 'en', context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if this is an order tracking query
    if (isOrderTrackingQuery(message)) {
      const orderResponse = await handleOrderTrackingQuery(message, context?.userId, language);
      if (orderResponse) {
        return res.json({
          success: true,
          data: {
            response: orderResponse,
            confidence: 0.9,
            model: 'order-tracker'
          }
        });
      }
    }

    // Check if user wants to speak with human
    if (isHumanRequestQuery(message, language)) {
      return res.json({
        success: true,
        data: {
          response: language === 'ar' ?
          'سأقوم بتحويلك إلى أحد موظفي خدمة العملاء. يرجى الانتظار...' :
          'I\'ll connect you with a human agent. Please wait...',
          confidence: 0.95,
          model: 'human-request'
        }
      });
    }

    // Get user data for AI context
    let userData = null;
    if (context?.includeUserData && userId) {
      userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          },
          cartItems: {
            include: {
              product: true
            }
          },
          favorites: {
            include: {
              product: true
            }
          }
        }
      });
    }

    // Generate AI response using OpenAI or similar service with user data
    const aiResponse = await generateAIResponse(message, language, { ...context, userData });

    // Save AI response to conversation
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          content: aiResponse.response,
          type: 'TEXT',
          senderType: 'AI',
          senderName: 'Soleva Assistant',
          isFromAI: true,
          aiModel: aiResponse.model,
          confidence: aiResponse.confidence
        }
      });
    }

    res.json({
      success: true,
      data: aiResponse
    });

  } catch (error) {
    console.error('AI response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response'
    });
  }
};

// Request human agent with queue system
export const requestHumanAgent = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user?.userId;
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check current active human chat sessions (limit to 3)
    const activeSessions = await prisma.conversation.count({
      where: {
        status: 'OPEN',
        assignedToId: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const maxConcurrentSessions = 3;
    let queued = false;
    let queuePosition = 0;

    if (activeSessions >= maxConcurrentSessions) {
      // Add to queue
      queued = true;

      // Count users in queue
      queuePosition = (await prisma.conversation.count({
        where: {
          status: 'PENDING',
          priority: 'HIGH',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })) + 1;

      // Update conversation to pending (in queue)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'PENDING',
          priority: 'HIGH'
        }
      });
    } else {
      // Connect directly to human agent
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'OPEN',
          priority: 'HIGH'
        }
      });
    }

    // Create system message
    await prisma.message.create({
      data: {
        conversationId,
        content: queued ?
        `Customer requested human agent - Added to queue (Position: ${queuePosition})` :
        'Customer requested human agent - Connected directly',
        type: 'SYSTEM',
        senderType: 'SYSTEM',
        senderName: 'System'
      }
    });

    // TODO: Notify admin team via email/SMS/WebSocket

    res.json({
      success: true,
      data: {
        queued,
        queuePosition: queued ? queuePosition : 0,
        message: queued ?
        'Added to waiting queue' :
        'Connected to human agent'
      }
    });

  } catch (error) {
    console.error('Request human agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request human agent'
    });
  }
};

// Get conversation messages
export const getConversationMessages = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { since } = req.query;

    const whereClause: any = { conversationId: id };
    if (since) {
      whereClause.createdAt = { gt: new Date(since as string) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

// Upload file for chat
export const uploadChatFile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { conversationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Save file info to message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: `📎 ${file.originalname}`,
        type: 'FILE',
        senderType: 'CUSTOMER',
        attachments: [file.path]
      }
    });

    res.json({
      success: true,
      data: {
        message,
        url: file.path
      }
    });

  } catch (error) {
    console.error('Upload chat file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
};

// Helper functions
const isOrderTrackingQuery = (message: string): boolean => {
  const orderKeywords = [
  'order', 'track', 'tracking', 'number', 'where', 'status', 'delivery',
  'طلب', 'تتبع', 'رقم', 'وين', 'فين', 'وصل', 'شحن'];


  return orderKeywords.some((keyword) =>
  message.toLowerCase().includes(keyword.toLowerCase())
  );
};

const isHumanRequestQuery = (message: string, language: string): boolean => {
  const humanKeywords = {
    en: ['human', 'agent', 'person', 'staff', 'representative', 'support'],
    ar: ['موظف', 'انسان', 'شخص', 'عميل', 'خدمة', 'مندوب']
  };

  const keywords = humanKeywords[language as keyof typeof humanKeywords] || humanKeywords.en;
  return keywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()));
};

const handleOrderTrackingQuery = async (message: string, userId?: string, language: string = 'en'): Promise<string | null> => {
  try {
    // Extract order number from message
    const orderNumberMatch = message.match(/SOL-\d{8}-\d{5}|#?\d{10,}/);

    if (!orderNumberMatch) {
      return language === 'ar' ?
      'يرجى تقديم رقم الطلب الخاص بك. يمكنك العثور عليه في بريدك الإلكتروني أو في قسم "طلباتي".' :
      'Please provide your order number. You can find it in your email or in the "My Orders" section.';
    }

    const orderNumber = orderNumberMatch[0];

    // Find order in database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
        { orderNumber },
        { id: orderNumber }],

        ...(userId ? { userId } : {})
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return language === 'ar' ?
      'لم أتمكن من العثور على طلب بهذا الرقم. يرجى التأكد من رقم الطلب والمحاولة مرة أخرى.' :
      'I couldn\'t find an order with that number. Please check the order number and try again.';
    }

    // Format order information
    return formatOrderInfo(order, language);

  } catch (error) {
    console.error('Order tracking error:', error);
    return null;
  }
};

const formatOrderInfo = (order: any, language: string): string => {
  const statusMap = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
    PROCESSING: { ar: 'قيد التحضير', en: 'Processing' },
    SHIPPED: { ar: 'تم الشحن', en: 'Shipped' },
    DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
    CANCELLED: { ar: 'ملغي', en: 'Cancelled' }
  };

  const paymentStatusMap = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    AWAITING_PROOF: { ar: 'في انتظار إثبات الدفع', en: 'Awaiting Proof' },
    UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review' },
    PAID: { ar: 'مدفوع', en: 'Paid' },
    FAILED: { ar: 'فشل', en: 'Failed' }
  };

  const shippingStatusMap = {
    PENDING: { ar: 'في الانتظار', en: 'Pending' },
    PROCESSING: { ar: 'قيد التحضير', en: 'Processing' },
    SHIPPED: { ar: 'تم الشحن', en: 'Shipped' },
    OUT_FOR_DELIVERY: { ar: 'في الطريق', en: 'Out for Delivery' },
    DELIVERED: { ar: 'تم التسليم', en: 'Delivered' }
  };

  if (language === 'ar') {
    return `📦 معلومات الطلب ${order.orderNumber}

الحالة: ${statusMap[order.orderStatus as keyof typeof statusMap]?.ar || order.orderStatus}
حالة الدفع: ${paymentStatusMap[order.paymentStatus as keyof typeof paymentStatusMap]?.ar || order.paymentStatus}
حالة الشحن: ${shippingStatusMap[order.shippingStatus as keyof typeof shippingStatusMap]?.ar || order.shippingStatus}
الإجمالي: ${order.totalAmount} ج.م

${order.trackingNumber ? `رقم التتبع: ${order.trackingNumber}` : ''}

${order.estimatedDelivery ? `التسليم المتوقع: ${new Date(order.estimatedDelivery).toLocaleDateString('ar-EG')}` : ''}`;
  } else {
    return `📦 Order ${order.orderNumber} Information

Status: ${statusMap[order.orderStatus as keyof typeof statusMap]?.en || order.orderStatus}
Payment: ${paymentStatusMap[order.paymentStatus as keyof typeof paymentStatusMap]?.en || order.paymentStatus}
Shipping: ${shippingStatusMap[order.shippingStatus as keyof typeof shippingStatusMap]?.en || order.shippingStatus}
Total: ${order.totalAmount} EGP

${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}

${order.estimatedDelivery ? `Est. Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString('en-US')}` : ''}`;
  }
};

const generateAIResponse = async (message: string, language: string, context: any): Promise<{response: string;confidence: number;model: string;}> => {
  try {
    // For now, return a simple response based on keywords
    // In production, you would integrate with OpenAI, Claude, or similar service

    const lowerMessage = message.toLowerCase();
    const userData = context?.userData;

    // Check if user is asking about their orders
    if (lowerMessage.includes('order') || lowerMessage.includes('طلب')) {
      if (userData?.orders && userData.orders.length > 0) {
        const latestOrder = userData.orders[0];
        return {
          response: language === 'ar' ?
          `لديك ${userData.orders.length} طلب. آخر طلب لك رقم ${latestOrder.orderNumber} بحالة ${latestOrder.orderStatus}. هل تريد معرفة تفاصيل أكثر؟` :
          `You have ${userData.orders.length} orders. Your latest order ${latestOrder.orderNumber} is ${latestOrder.orderStatus}. Would you like more details?`,
          confidence: 0.9,
          model: 'user-data-bot'
        };
      } else {
        return {
          response: language === 'ar' ?
          'لم أجد أي طلبات في حسابك. هل تريد المساعدة في العثور على منتجات مناسبة؟' :
          'I don\'t see any orders in your account. Would you like help finding suitable products?',
          confidence: 0.9,
          model: 'user-data-bot'
        };
      }
    }

    // Check if user is asking about cart
    if (lowerMessage.includes('cart') || lowerMessage.includes('سلة')) {
      if (userData?.cartItems && userData.cartItems.length > 0) {
        return {
          response: language === 'ar' ?
          `لديك ${userData.cartItems.length} منتج في السلة. هل تريد إكمال عملية الشراء؟` :
          `You have ${userData.cartItems.length} items in your cart. Would you like to complete your purchase?`,
          confidence: 0.9,
          model: 'user-data-bot'
        };
      } else {
        return {
          response: language === 'ar' ?
          'سلة التسوق فارغة. هل تريد استكشاف منتجاتنا؟' :
          'Your cart is empty. Would you like to explore our products?',
          confidence: 0.9,
          model: 'user-data-bot'
        };
      }
    }

    // Check if user is asking about favorites
    if (lowerMessage.includes('favorite') || lowerMessage.includes('مفضل')) {
      if (userData?.favorites && userData.favorites.length > 0) {
        return {
          response: language === 'ar' ?
          `لديك ${userData.favorites.length} منتج في المفضلة. هل تريد رؤية قائمة المفضلة؟` :
          `You have ${userData.favorites.length} items in your favorites. Would you like to see your favorites list?`,
          confidence: 0.9,
          model: 'user-data-bot'
        };
      } else {
        return {
          response: language === 'ar' ?
          'لا توجد منتجات في المفضلة. هل تريد استكشاف منتجاتنا؟' :
          'No items in your favorites. Would you like to explore our products?',
          confidence: 0.9,
          model: 'user-data-bot'
        };
      }
    }

    // FAQ responses
    if (lowerMessage.includes('shipping') || lowerMessage.includes('شحن')) {
      return {
        response: language === 'ar' ?
        'نحن نقدم الشحن إلى جميع أنحاء مصر. التوصيل مجاني للطلبات التي تزيد عن 500 ج.م. مدة التوصيل من 2-5 أيام عمل.' :
        'We ship to all of Egypt. Free delivery for orders over 500 EGP. Delivery time is 2-5 business days.',
        confidence: 0.9,
        model: 'faq-bot'
      };
    }

    if (lowerMessage.includes('return') || lowerMessage.includes('مرتجع')) {
      return {
        response: language === 'ar' ?
        'يمكنك إرجاع المنتجات خلال 14 يوم من تاريخ الاستلام. يجب أن تكون المنتجات في حالتها الأصلية. يرجى التواصل معنا لبدء عملية الإرجاع.' :
        'You can return products within 14 days of delivery. Products must be in original condition. Please contact us to start the return process.',
        confidence: 0.9,
        model: 'faq-bot'
      };
    }

    if (lowerMessage.includes('size') || lowerMessage.includes('مقاس')) {
      return {
        response: language === 'ar' ?
        'يمكنك العثور على جدول المقاسات في صفحة المنتج. إذا كنت بحاجة إلى مساعدة في اختيار المقاس المناسب، يمكنني مساعدتك.' :
        'You can find the size chart on the product page. If you need help choosing the right size, I can assist you.',
        confidence: 0.8,
        model: 'faq-bot'
      };
    }

    // Default response
    return {
      response: language === 'ar' ?
      'شكراً لرسالتك! كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في تتبع الطلبات، معلومات المنتجات، الشحن، أو أي استفسارات أخرى.' :
      'Thank you for your message! How can I help you today? I can assist with order tracking, product information, shipping, or any other inquiries.',
      confidence: 0.7,
      model: 'general-bot'
    };

  } catch (error) {
    console.error('AI response generation error:', error);
    return {
      response: language === 'ar' ?
      'أعتذر، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى أو طلب التحدث مع أحد موظفي خدمة العملاء.' :
      'I apologize, there was an error processing your message. Please try again or request to speak with a human agent.',
      confidence: 0.5,
      model: 'error-handler'
    };
  }
};

// Get chat availability status
export const getChatAvailability = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { language = 'en' } = req.query;

    // Working hours configuration
    const workingHours = {
      timezone: 'Africa/Cairo',
      days: {
        saturday: { start: '09:00', end: '18:00', enabled: true },
        sunday: { start: '09:00', end: '18:00', enabled: true },
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: false }
      }
    };

    // Check if current time is within working hours
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: workingHours.timezone }));
    const currentDay = timeInTimezone.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: workingHours.timezone
    }).toLowerCase();

    const dayConfig = workingHours.days[currentDay as keyof typeof workingHours.days];
    let isLiveChatAvailable = dayConfig?.enabled || false;

    if (isLiveChatAvailable && dayConfig) {
      const currentTime = timeInTimezone.getHours() * 60 + timeInTimezone.getMinutes();
      const startParts = dayConfig.start.split(':');
      const endParts = dayConfig.end.split(':');

      if (startParts.length === 2 && endParts.length === 2 &&
      startParts[0] && startParts[1] && endParts[0] && endParts[1]) {
        const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        if (currentTime < startTime || currentTime > endTime) {
          isLiveChatAvailable = false;
        }
      }
    }

    // Get next available time
    let nextAvailableTime = null;
    if (!isLiveChatAvailable) {
      // Find next available day
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);

        const dayName = checkDate.toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: workingHours.timezone
        }).toLowerCase();

        const dayConfig = workingHours.days[dayName as keyof typeof workingHours.days];

        if (dayConfig && dayConfig.enabled) {
          const startParts = dayConfig.start.split(':');
          if (startParts.length === 2 && startParts[0] && startParts[1]) {
            const startHour = parseInt(startParts[0]);
            const startMinute = parseInt(startParts[1]);
            nextAvailableTime = new Date(checkDate);
            nextAvailableTime.setHours(startHour, startMinute, 0, 0);
            break;
          }
        }
      }
    }

    const availability = {
      isLiveChatAvailable,
      isAIAvailable: true, // AI is always available
      nextAvailableTime,
      currentMode: isLiveChatAvailable ? 'LIVE' : 'AI',
      message: isLiveChatAvailable ?
      language === 'ar' ? 'وكلاؤنا المباشرون متاحون الآن' : 'Our live agents are available now' :
      language === 'ar' ?
      `وكلاؤنا المباشرون غير متاحين حالياً. يرجى ترك رسالة أو التحدث مع مساعدنا الذكي.${nextAvailableTime ? ` سيكونون متاحين ${nextAvailableTime.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { timeZone: workingHours.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}` :
      `Our live agents are currently offline. Please leave a message or chat with our AI Assistant.${nextAvailableTime ? ` They will be available ${nextAvailableTime.toLocaleString('en-US', { timeZone: workingHours.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}`
    };

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    console.error('Get chat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat availability'
    });
  }
};