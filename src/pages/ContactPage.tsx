import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiMail,
  FiMapPin,
  FiClock,
  FiSend,
  FiUser,
  FiMessageSquare,
  FiShoppingBag,
  FiMessageCircle,
  FiFacebook,
  FiInstagram } from
'react-icons/fi';
import { useLang } from '../contexts/LangContext';
import { useToast } from '../contexts/ToastContext';
import GlassCard from '../components/GlassCard';
import SectionTitle from '../components/SectionTitle';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber: string;
  honeypot: string; // Anti-spam honeypot field
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderNumber: '',
    honeypot: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { lang } = useLang();
  const { showToast } = useToast();

  const contactInfo = {
    emails: {
      info: 'info@solevaeg.com',
      sales: 'sales@solevaeg.com',
      business: 'business@solevaeg.com',
      support: 'support@solevaeg.com'
    },
    whatsapp: '010 2835 4015',
    whatsappLink: 'https://wa.me/201028354015',
    address: {
      ar: 'القاهرة، مصر',
      en: 'Cairo, Egypt'
    },
    hours: {
      ar: 'السبت - الخميس: 9:00 ص - 6:00 م',
      en: 'Saturday - Thursday: 9:00 AM - 6:00 PM'
    },
    socialMedia: {
      facebook: 'https://www.facebook.com/solevaeg',
      instagram: 'https://www.instagram.com/soleva.eg/'
      // Twitter hidden but kept for future use
      // twitter: 'https://twitter.com/soleva'
    }
  };

  const subjectOptions = [
  { value: 'general', label: { ar: 'استفسار عام', en: 'General Inquiry' } },
  { value: 'order', label: { ar: 'استفسار عن طلب', en: 'Order Inquiry' } },
  { value: 'product', label: { ar: 'استفسار عن منتج', en: 'Product Inquiry' } },
  { value: 'shipping', label: { ar: 'الشحن والتوصيل', en: 'Shipping & Delivery' } },
  { value: 'return', label: { ar: 'إرجاع أو استبدال', en: 'Return or Exchange' } },
  { value: 'technical', label: { ar: 'مشكلة تقنية', en: 'Technical Issue' } },
  { value: 'partnership', label: { ar: 'شراكة تجارية', en: 'Business Partnership' } },
  { value: 'complaint', label: { ar: 'شكوى', en: 'Complaint' } }];


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Anti-spam check - honeypot should be empty
    if (formData.honeypot) {
      showToast('Spam detected');
      return false;
    }

    if (!formData.name.trim()) {
      newErrors.name = lang === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = lang === 'ar' ? 'الاسم قصير جداً' : 'Name is too short';
    }

    if (!formData.email.trim()) {
      newErrors.email = lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = lang === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
    }

    if (!formData.subject) {
      newErrors.subject = lang === 'ar' ? 'الموضوع مطلوب' : 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = lang === 'ar' ? 'الرسالة مطلوبة' : 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = lang === 'ar' ? 'الرسالة قصيرة جداً' : 'Message is too short';
    }


    if (formData.subject === 'order' && !formData.orderNumber.trim()) {
      newErrors.orderNumber = lang === 'ar' ? 'رقم الطلب مطلوب للاستفسارات المتعلقة بالطلبات' : 'Order number is required for order inquiries';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(
        lang === 'ar' ? 'يرجى تصحيح الأخطاء في النموذج' : 'Please correct the errors in the form'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
          orderNumber: formData.orderNumber.trim() || undefined,
          language: lang,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        showToast(
          lang === 'ar' ?
          `تم إرسال رسالتك بنجاح. رقم المرجع: ${data.data.ticketNumber}` :
          `Your message has been sent successfully. Reference number: ${data.data.ticketNumber}`
        );

        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          orderNumber: '',
          honeypot: ''
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error: any) {
      showToast(
        lang === 'ar' ?
        'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.' :
        'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
      <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content">

            <SectionTitle>
              <h1>{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h1>
              <p>{lang === 'ar' ?
                'نحن هنا لمساعدتك. تواصل معنا في أي وقت' :
                'We\'re here to help. Reach out to us anytime'
                }</p>
            </SectionTitle>
      </motion.div>
        </div>
      </section>

      <div className="container">
        <div className="contact-content">
        {/* Contact Information */}
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="contact-info">

            <GlassCard className="info-card">
              <h3 className="info-title">
                {lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
              </h3>
              
              {/* Email Addresses */}
              <div className="contact-item">
                <div className="contact-icon">
                  <FiMail />
                </div>
                <div className="contact-details">
                  <h4>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Addresses'}</h4>
                  <div className="email-list">
                    <div className="email-item">
                      <span className="email-label">
                        {lang === 'ar' ? 'عام:' : 'General:'}
                      </span>
                      <a href={`mailto:${contactInfo.emails.info}`}>
                        {contactInfo.emails.info}
                      </a>
                    </div>
                    <div className="email-item">
                      <span className="email-label">
                        {lang === 'ar' ? 'المبيعات:' : 'Sales:'}
                      </span>
                      <a href={`mailto:${contactInfo.emails.sales}`}>
                        {contactInfo.emails.sales}
                      </a>
                    </div>
                    <div className="email-item">
                      <span className="email-label">
                        {lang === 'ar' ? 'الأعمال:' : 'Business:'}
                      </span>
                      <a href={`mailto:${contactInfo.emails.business}`}>
                        {contactInfo.emails.business}
                      </a>
                  </div>
                    <div className="email-item">
                      <span className="email-label">
                        {lang === 'ar' ? 'الدعم:' : 'Support:'}
                      </span>
                      <a href={`mailto:${contactInfo.emails.support}`}>
                        {contactInfo.emails.support}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="contact-item">
                <div className="contact-icon">
                  <FiMessageCircle />
                </div>
                <div className="contact-details">
                  <h4>WhatsApp</h4>
                  <a href={contactInfo.whatsappLink} target="_blank" rel="noopener noreferrer">
                    {contactInfo.whatsapp}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="contact-item">
                <div className="contact-icon">
                  <FiMapPin />
                </div>
                <div className="contact-details">
                  <h4>{lang === 'ar' ? 'العنوان' : 'Address'}</h4>
                  <p>{contactInfo.address[lang as 'ar' | 'en']}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="contact-item">
                <div className="contact-icon">
                  <FiClock />
                </div>
                <div className="contact-details">
                  <h4>{lang === 'ar' ? 'ساعات العمل' : 'Business Hours'}</h4>
                  <p>{contactInfo.hours[lang as 'ar' | 'en']}</p>
                </div>
              </div>

              {/* Social Media */}
              <div className="contact-item">
                <div className="contact-icon">
                  <FiFacebook />
                </div>
                <div className="contact-details">
                  <h4>{lang === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media'}</h4>
                  <div className="social-links">
                    <a
                      href={contactInfo.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link">

                      <FiFacebook size={16} />
                      <span>Facebook</span>
                    </a>
                    <a
                      href={contactInfo.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link">

                      <FiInstagram size={16} />
                      <span>Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

        {/* Contact Form */}
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="contact-form-container">

            <GlassCard className="form-card">
              {submitted ?
              <div className="success-message">
                  <div className="success-icon">✅</div>
                  <h3>
                    {lang === 'ar' ? 'تم إرسال رسالتك!' : 'Message Sent!'}
                  </h3>
                  <p>
                    {lang === 'ar' ?
                  'شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.' :
                  'Thank you for contacting us. We\'ll get back to you as soon as possible.'
                  }
                  </p>
                  <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-primary px-6 py-3 text-base min-h-[44px]"
                  type="button">

                    {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div> :

              <form onSubmit={handleSubmit} className="contact-form">
                  <h3 className="form-title">
                    {lang === 'ar' ? 'أرسل لنا رسالة' : 'Send us a Message'}
                  </h3>

                  {/* Anti-spam honeypot field (hidden) */}
                  <input
                  type="text"
                  name="website"
                  value={formData.honeypot}
                  onChange={(e) => handleInputChange('honeypot', e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off" />


                  <div className="form-grid">
                    {/* Name */}
                    <div className="form-group">
                      <label className="form-label">
                        <FiUser />
                        {lang === 'ar' ? 'الاسم' : 'Name'} *
                      </label>
                      <input
                      type="text"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={lang === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                      required />

                      {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">
                        <FiMail />
                        {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                  </label>
                  <input
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      required />

                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>


                    {/* Subject */}
                    <div className="form-group">
                      <label className="form-label">
                        <FiMessageSquare />
                        {lang === 'ar' ? 'الموضوع' : 'Subject'} *
                      </label>
                      <select
                      className={`form-input ${errors.subject ? 'error' : ''}`}
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required>

                        <option value="">
                          {lang === 'ar' ? 'اختر الموضوع' : 'Select Subject'}
                        </option>
                        {subjectOptions.map((option) =>
                      <option key={option.value} value={option.value}>
                            {option.label[lang as 'ar' | 'en']}
                          </option>
                      )}
                      </select>
                      {errors.subject && <span className="error-text">{errors.subject}</span>}
              </div>

                    {/* Order Number (conditional) */}
                    {formData.subject === 'order' &&
                  <div className="form-group full-width">
                        <label className="form-label">
                          <FiShoppingBag />
                          {lang === 'ar' ? 'رقم الطلب' : 'Order Number'} *
                </label>
                <input
                      type="text"
                      className={`form-input ${errors.orderNumber ? 'error' : ''}`}
                      value={formData.orderNumber}
                      onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                      placeholder={lang === 'ar' ? 'SOL-20240101-12345' : 'SOL-20240101-12345'} />

                        {errors.orderNumber && <span className="error-text">{errors.orderNumber}</span>}
              </div>
                  }

                    {/* Message */}
                    <div className="form-group full-width">
                      <label className="form-label">
                        <FiMessageSquare />
                        {lang === 'ar' ? 'الرسالة' : 'Message'} *
                </label>
                <textarea
                      className={`form-input ${errors.message ? 'error' : ''}`}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder={lang === 'ar' ?
                      'اكتب رسالتك هنا...' :
                      'Write your message here...'
                      }
                      required />

                      {errors.message && <span className="error-text">{errors.message}</span>}
                    </div>
              </div>

                  <div className="form-actions">
              <button
                    type="submit"
                    className="btn btn-primary px-6 py-3 text-base min-h-[44px] submit-button gap-2 flex items-center justify-center"
                    disabled={loading}>

                    <FiSend />
                      {loading ?
                    lang === 'ar' ? 'جاري الإرسال...' : 'Sending...' :
                    lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'
                    }
                    </button>
                  </div>
            </form>
              }
          </GlassCard>
        </motion.div>
      </div>
      </div>

      <style>{`
        .contact-page {
          min-height: 100vh;
          padding-top: 2rem;
        }

        .hero-section {
          padding: 4rem 0;
          text-align: center;
        }

        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .contact-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 4rem;
        }

        @media (min-width: 1024px) {
          .contact-content {
            grid-template-columns: 400px 1fr;
            gap: 3rem;
          }
        }

        .contact-info {
          order: 2;
        }

        @media (min-width: 1024px) {
          .contact-info {
            order: 1;
          }
        }

        .contact-form-container {
          order: 1;
        }

        @media (min-width: 1024px) {
          .contact-form-container {
            order: 2;
          }
        }

        .info-card {
          padding: 2rem;
          height: fit-content;
        }

        .info-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2rem;
          text-align: center;
        }

        .contact-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: flex-start;
        }

        .contact-item:last-child {
          margin-bottom: 0;
        }

        .contact-icon {
          width: 40px;
          height: 40px;
          background: var(--primary-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .contact-details h4 {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .contact-details p,
        .contact-details a {
          color: var(--text-secondary);
          text-decoration: none;
          line-height: 1.5;
        }

        .contact-details a:hover {
          color: var(--primary);
        }

        .email-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .email-item {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .email-label {
          font-weight: 500;
          color: var(--text-primary);
          min-width: 60px;
        }

        .form-card {
          padding: 2rem;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2rem;
          text-align: center;
        }

        .contact-form {
          width: 100%;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--glass-bg);
          backdrop-filter: blur(15px) saturate(150%);
          -webkit-backdrop-filter: blur(15px) saturate(150%);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          resize: vertical;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-100);
          transform: translateY(-1px);
        }

        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .error-text {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .form-actions {
          display: flex;
          justify-content: center;
        }

        .submit-button {
          min-width: 200px;
          gap: 0.5rem;
        }

        .success-message {
          text-align: center;
          padding: 2rem;
        }

        .success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .success-message h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .success-message p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        @media (max-width: 640px) {
          .info-card,
          .form-card {
            padding: 1.5rem;
          }
          
          .hero-section {
            padding: 2rem 0;
          }
        }
      `}</style>
    </div>);

};

export default ContactPage;