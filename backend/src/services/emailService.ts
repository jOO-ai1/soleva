import nodemailer from 'nodemailer';
// import { PrismaClient } from '@prisma/client'; // Unused for now

// const prisma = new PrismaClient(); // Unused for now

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  orderConfirmation: {
    subject: {
      ar: 'تأكيد طلبك - سوليفا',
      en: 'Order Confirmation - Soleva'
    },
    template: (order: any, lang: 'ar' | 'en') => {
      const isArabic = lang === 'ar';
      return `
        <!DOCTYPE html>
        <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${lang}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isArabic ? 'تأكيد الطلب' : 'Order Confirmation'}</title>
          <style>
            body { 
              font-family: ${isArabic ? 'Cairo, Arial' : 'Arial, sans-serif'}; 
              line-height: 1.6; 
              color: #333; 
              background: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #d1b16a 0%, #b8965a 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 30px; }
            .order-info { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #d1b16a;
            }
            .order-items { margin: 20px 0; }
            .item { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 0; 
              border-bottom: 1px solid #eee; 
            }
            .total { 
              font-weight: bold; 
              font-size: 18px; 
              color: #d1b16a; 
              text-align: ${isArabic ? 'left' : 'right'};
              margin-top: 15px;
            }
            .footer { 
              background: #333; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #d1b16a;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isArabic ? 'سوليفا' : 'Soleva'}</h1>
              <p>${isArabic ? 'شكراً لطلبك!' : 'Thank you for your order!'}</p>
            </div>
            
            <div class="content">
              <h2>${isArabic ? 'تم تأكيد طلبك' : 'Order Confirmed'}</h2>
              <p>${isArabic ? 
                `مرحباً ${order.user.name}، تم تأكيد طلبك بنجاح وسيتم معالجته قريباً.` :
                `Hello ${order.user.name}, your order has been confirmed and will be processed soon.`
              }</p>
              
              <div class="order-info">
                <h3>${isArabic ? 'تفاصيل الطلب' : 'Order Details'}</h3>
                <p><strong>${isArabic ? 'رقم الطلب:' : 'Order Number:'}</strong> ${order.orderNumber}</p>
                <p><strong>${isArabic ? 'التاريخ:' : 'Date:'}</strong> ${new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                <p><strong>${isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</strong> ${getPaymentMethodText(order.paymentMethod, lang)}</p>
              </div>
              
              <div class="order-items">
                <h3>${isArabic ? 'المنتجات' : 'Items'}</h3>
                ${order.items.map((item: any) => `
                  <div class="item">
                    <div>
                      <strong>${item.productSnapshot.name[lang]}</strong>
                      ${item.productSnapshot.variant ? `<br><small>${item.productSnapshot.variant.color[lang]} - ${item.productSnapshot.variant.size}</small>` : ''}
                    </div>
                    <div>
                      ${item.quantity} × ${item.unitPrice} ${isArabic ? 'ج.م' : 'EGP'}
                    </div>
                  </div>
                `).join('')}
                
                <div class="total">
                  ${isArabic ? 'الإجمالي:' : 'Total:'} ${order.totalAmount} ${isArabic ? 'ج.م' : 'EGP'}
                </div>
              </div>
              
              ${order.paymentMethod !== 'CASH_ON_DELIVERY' ? `
                <div class="order-info">
                  <h3>${isArabic ? 'معلومات الدفع' : 'Payment Information'}</h3>
                  <p>${isArabic ? 
                    'يرجى إتمام عملية الدفع ورفع إثبات الدفع من خلال حسابك على الموقع.' :
                    'Please complete payment and upload proof through your account on the website.'
                  }</p>
                  <a href="https://solevaeg.com/orders/${order.id}" class="button">
                    ${isArabic ? 'رفع إثبات الدفع' : 'Upload Payment Proof'}
                  </a>
                </div>
              ` : ''}
              
              <div class="order-info">
                <h3>${isArabic ? 'عنوان التسليم' : 'Delivery Address'}</h3>
                <p>
                  ${order.address.recipientName}<br>
                  ${order.address.street}, ${order.address.building}<br>
                  ${order.address.village ? `${order.address.village}, ` : ''}${order.address.center}, ${order.address.governorate}<br>
                  ${isArabic ? 'الهاتف:' : 'Phone:'} ${order.address.phone}
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>${isArabic ? 'سوليفا - صُنع للحركة' : 'Soleva - Made to Move'}</p>
              <p>${isArabic ? 'للاستفسارات:' : 'For inquiries:'} support@solevaeg.com</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  },
  
  paymentInstructions: {
    subject: {
      ar: 'تعليمات الدفع - طلب رقم {orderNumber}',
      en: 'Payment Instructions - Order {orderNumber}'
    },
    template: (order: any, lang: 'ar' | 'en') => {
      const isArabic = lang === 'ar';
      const paymentInfo = getPaymentInformation(order.paymentMethod);
      
      return `
        <!DOCTYPE html>
        <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${lang}">
        <head>
          <meta charset="UTF-8">
          <title>${isArabic ? 'تعليمات الدفع' : 'Payment Instructions'}</title>
          <style>
            body { font-family: ${isArabic ? 'Cairo, Arial' : 'Arial, sans-serif'}; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #d1b16a; }
            .payment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${isArabic ? 'تعليمات الدفع' : 'Payment Instructions'}</h1>
            
            <div class="highlight">
              <h2>${isArabic ? 'إجمالي المبلغ المطلوب:' : 'Total Amount Due:'} ${order.totalAmount} ${isArabic ? 'ج.م' : 'EGP'}</h2>
            </div>
            
            <div class="payment-info">
              <h3>${paymentInfo.title[lang]}</h3>
              <p><strong>${paymentInfo.numberLabel[lang]}:</strong> ${paymentInfo.number}</p>
              <p>${paymentInfo.instructions[lang]}</p>
            </div>
            
            <p>${isArabic ? 
              'بعد إتمام عملية التحويل، يرجى رفع صورة من إيصال التحويل من خلال حسابك على الموقع.' :
              'After completing the transfer, please upload a screenshot of the receipt through your account.'
            }</p>
          </div>
        </body>
        </html>
      `;
    }
  }
};

// Helper functions
const getPaymentMethodText = (method: string, lang: 'ar' | 'en') => {
  const methods: Record<string, Record<string, string>> = {
    CASH_ON_DELIVERY: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
    BANK_WALLET: { ar: 'محفظة البنك', en: 'Bank Wallet' },
    DIGITAL_WALLET: { ar: 'المحفظة الرقمية', en: 'Digital Wallet' }
  };
  return methods[method]?.[lang] || method;
};

const getPaymentInformation = (method: string) => {
  const paymentInfo: Record<string, any> = {
    BANK_WALLET: {
      title: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
      numberLabel: { ar: 'رقم الحساب', en: 'Account Number' },
      number: '5264 3999 9797 28173',
      instructions: {
        ar: 'يرجى تحويل المبلغ إلى رقم الحساب أعلاه ثم رفع صورة من إيصال التحويل.',
        en: 'Please transfer the amount to the account number above and upload a screenshot of the receipt.'
      }
    },
    DIGITAL_WALLET: {
      title: { ar: 'محفظة رقمية', en: 'Digital Wallet' },
      numberLabel: { ar: 'رقم المحفظة', en: 'Wallet Number' },
      number: '01028354015',
      instructions: {
        ar: 'يرجى إرسال المبلغ إلى رقم المحفظة أعلاه ثم رفع صورة من إيصال الإرسال.',
        en: 'Please send the amount to the wallet number above and upload a screenshot of the receipt.'
      }
    }
  };
  
  return paymentInfo[method] || paymentInfo.BANK_WALLET;
};

// Email sending functions
export const sendOrderConfirmationEmail = async (order: any) => {
  try {
    const transporter = createTransporter();
    const lang = 'en'; // Could be determined from user preferences
    
    const mailOptions = {
      from: `"Soleva" <${process.env.EMAIL_SALES}>`,
      to: order.user.email,
      subject: emailTemplates.orderConfirmation.subject[lang].replace('{orderNumber}', order.orderNumber),
      html: emailTemplates.orderConfirmation.template(order, lang)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${order.user.email}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
};

export const sendPaymentInstructionsEmail = async (order: any) => {
  try {
    if (order.paymentMethod === 'CASH_ON_DELIVERY') {
      return; // No payment instructions needed for COD
    }
    
    const transporter = createTransporter();
    const lang = 'en'; // Could be determined from user preferences
    
    const mailOptions = {
      from: `"Soleva" <${process.env.EMAIL_SALES}>`,
      to: order.user.email,
      subject: emailTemplates.paymentInstructions.subject[lang].replace('{orderNumber}', order.orderNumber),
      html: emailTemplates.paymentInstructions.template(order, lang)
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Payment instructions email sent to ${order.user.email}`);
  } catch (error) {
    console.error('Failed to send payment instructions email:', error);
    throw error;
  }
};

export const sendOrderStatusUpdateEmail = async (order: any, newStatus: string) => {
  try {
    const transporter = createTransporter();
    const lang = 'en';
    
    const statusMessages: Record<string, Record<string, string>> = {
      CONFIRMED: {
        ar: 'تم تأكيد طلبك وسيتم تحضيره قريباً',
        en: 'Your order has been confirmed and will be prepared soon'
      },
      PROCESSING: {
        ar: 'جاري تحضير طلبك',
        en: 'Your order is being prepared'
      },
      SHIPPED: {
        ar: 'تم شحن طلبك',
        en: 'Your order has been shipped'
      },
      DELIVERED: {
        ar: 'تم تسليم طلبك بنجاح',
        en: 'Your order has been delivered successfully'
      }
    };
    
    const message = statusMessages[newStatus]?.[lang] || `Order status updated to ${newStatus}`;
    
    const mailOptions = {
      from: `"Soleva" <${process.env.EMAIL_SALES}>`,
      to: order.user.email,
      subject: `Order Update - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          <p>Hello ${order.user.name},</p>
          <p>${message}</p>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          <p>You can track your order status at: <a href="https://solevaeg.com/orders/${order.id}">View Order</a></p>
          <hr>
          <p>Best regards,<br>Soleva Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Order status update email sent to ${order.user.email}`);
  } catch (error) {
    console.error('Failed to send order status update email:', error);
    throw error;
  }
};

export const sendContactFormEmail = async (formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber?: string;
}) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${formData.name}" <${process.env.EMAIL_INFO}>`,
      to: process.env.EMAIL_SUPPORT,
      replyTo: formData.email,
      subject: `Contact Form: ${formData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
          ${formData.orderNumber ? `<p><strong>Order Number:</strong> ${formData.orderNumber}</p>` : ''}
          <hr>
          <p><strong>Message:</strong></p>
          <p>${formData.message.replace(/\n/g, '<br>')}</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Contact form email sent from ${formData.email}`);
    
    // Send auto-reply to customer
    const autoReplyOptions = {
      from: `"Soleva Support" <${process.env.EMAIL_SUPPORT}>`,
      to: formData.email,
      subject: 'Thank you for contacting Soleva',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for contacting us!</h2>
          <p>Dear ${formData.name},</p>
          <p>We have received your message and will get back to you within 24 hours.</p>
          <p>Your reference number is: <strong>REF-${Date.now()}</strong></p>
          <hr>
          <p>Best regards,<br>Soleva Customer Support</p>
          <p>Email: support@solevaeg.com</p>
        </div>
      `
    };
    
    await transporter.sendMail(autoReplyOptions);
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (user: { name: string; email: string }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Soleva" <${process.env.EMAIL_INFO}>`,
      to: user.email,
      subject: 'Welcome to Soleva - Your Premium Footwear Destination',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d1b16a 0%, #b8965a 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">Welcome to Soleva</h1>
            <p style="margin: 10px 0 0 0;">Made to Move</p>
          </div>
          
          <div style="padding: 30px;">
            <h2>Hello ${user.name}!</h2>
            <p>Welcome to Soleva, your premium destination for luxury footwear.</p>
            
            <p>As a member of our community, you'll enjoy:</p>
            <ul>
              <li>Exclusive access to new collections</li>
              <li>Special member discounts</li>
              <li>Priority customer support</li>
              <li>Free shipping on orders over 500 EGP</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://solevaeg.com/products" style="background: #d1b16a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Shopping
              </a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team at support@solevaeg.com</p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p>Soleva - Made to Move</p>
            <p>Cairo, Egypt | info@solevaeg.com</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (user: { name: string; email: string }, resetToken: string) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `https://solevaeg.com/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Soleva" <${process.env.EMAIL_INFO}>`,
      to: user.email,
      subject: 'Reset Your Soleva Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password for your Soleva account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #d1b16a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <hr>
          <p>Best regards,<br>Soleva Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};
