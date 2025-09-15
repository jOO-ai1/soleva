import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiCamera, 
  FiUpload, 
  FiCheck,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useToast } from '../contexts/ToastContext';
import GlassButton from '../components/GlassButton';
import GlassCard from '../components/GlassCard';

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
  canReturn: boolean;
  returnDeadline: string;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  canReturn: boolean;
  returnReason?: string;
}

interface ReturnFormData {
  orderId: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason: string;
    condition: string;
    description: string;
  }>;
  returnMethod: 'PICKUP' | 'DROP_OFF';
  bankDetails?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    iban?: string;
  };
  images: File[];
}

const ReturnRequestPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLang();
  const t = useTranslation();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReturnFormData>({
    orderId: orderId || '',
    items: [],
    returnMethod: 'PICKUP',
    images: []
  });

  const returnReasons = [
    { value: 'DEFECTIVE', label: { ar: 'عيب في المنتج', en: 'Defective Product' } },
    { value: 'WRONG_SIZE', label: { ar: 'مقاس خاطئ', en: 'Wrong Size' } },
    { value: 'WRONG_COLOR', label: { ar: 'لون خاطئ', en: 'Wrong Color' } },
    { value: 'NOT_AS_DESCRIBED', label: { ar: 'لا يطابق الوصف', en: 'Not as Described' } },
    { value: 'DAMAGED_SHIPPING', label: { ar: 'تلف أثناء الشحن', en: 'Damaged During Shipping' } },
    { value: 'CHANGED_MIND', label: { ar: 'غيرت رأيي', en: 'Changed Mind' } },
    { value: 'OTHER', label: { ar: 'أخرى', en: 'Other' } }
  ];

  const conditionOptions = [
    { value: 'NEW', label: { ar: 'جديد مع العلبة', en: 'New with Box' } },
    { value: 'LIKE_NEW', label: { ar: 'جديد بدون علبة', en: 'Like New without Box' } },
    { value: 'WORN_ONCE', label: { ar: 'تم ارتداؤه مرة واحدة', en: 'Worn Once' } },
    { value: 'LIGHTLY_USED', label: { ar: 'استخدام خفيف', en: 'Lightly Used' } },
    { value: 'DAMAGED', label: { ar: 'تالف', en: 'Damaged' } }
  ];

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
        
        // Initialize form with returnable items
        const returnableItems = data.data.items
          .filter((item: OrderItem) => item.canReturn)
          .map((item: OrderItem) => ({
            orderItemId: item.id,
            quantity: 1,
            reason: '',
            condition: 'NEW',
            description: ''
          }));
        
        setFormData(prev => ({
          ...prev,
          items: returnableItems
        }));
      } else {
        showToast(
          lang === 'ar' ? 'فشل في تحميل الطلب' : 'Failed to load order',
          'error'
        );
        navigate('/account/orders');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      showToast(
        lang === 'ar' ? 'حدث خطأ في تحميل الطلب' : 'Error loading order',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateItemReturn = (orderItemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const toggleItemReturn = (orderItemId: string, checked: boolean) => {
    if (checked) {
      const orderItem = order?.items.find(item => item.id === orderItemId);
      if (orderItem) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, {
            orderItemId,
            quantity: 1,
            reason: '',
            condition: 'NEW',
            description: ''
          }]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.orderItemId !== orderItemId)
      }));
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValid) {
        showToast(
          lang === 'ar' 
            ? 'يجب أن تكون الصور أقل من 10 ميجابايت'
            : 'Images must be less than 10MB',
          'error'
        );
      }
      return isValid;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return formData.items.length > 0;
      case 2:
        return formData.items.every(item => item.reason && item.condition);
      case 3:
        return formData.returnMethod !== undefined;
      default:
        return true;
    }
  };

  const submitReturn = async () => {
    if (!validateStep(3)) {
      showToast(
        lang === 'ar' ? 'يرجى إكمال جميع الحقول المطلوبة' : 'Please complete all required fields',
        'error'
      );
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('returnData', JSON.stringify({
        orderId: formData.orderId,
        items: formData.items,
        returnMethod: formData.returnMethod,
        bankDetails: formData.bankDetails
      }));

      // Add images
      formData.images.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      const response = await fetch('/api/v1/returns/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      if (response.ok) {
        const data = await response.json();
        showToast(
          lang === 'ar' 
            ? `تم إنشاء طلب الإرجاع بنجاح. رقم المرجع: ${data.data.returnNumber}`
            : `Return request created successfully. Reference: ${data.data.returnNumber}`,
          'success'
        );
        navigate(`/account/returns/${data.data.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Failed to submit return:', error);
      showToast(
        error.message || (lang === 'ar' ? 'فشل في إنشاء طلب الإرجاع' : 'Failed to create return request'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="return-request-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="return-request-page">
        <div className="container">
          <GlassCard className="error-card">
            <FiAlertCircle size={48} />
            <h2>{lang === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'}</h2>
            <p>
              {lang === 'ar' 
                ? 'لم يتم العثور على الطلب المطلوب'
                : 'The requested order could not be found'
              }
            </p>
            <GlassButton onClick={() => navigate('/account/orders')}>
              {lang === 'ar' ? 'العودة إلى الطلبات' : 'Back to Orders'}
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h3>{lang === 'ar' ? 'اختر المنتجات للإرجاع' : 'Select Items to Return'}</h3>
            <p className="step-description">
              {lang === 'ar' 
                ? 'اختر المنتجات التي تريد إرجاعها من طلبك'
                : 'Choose the items you want to return from your order'
              }
            </p>

            <div className="order-items">
              {order.items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={formData.items.some(returnItem => returnItem.orderItemId === item.id)}
                      onChange={(e) => toggleItemReturn(item.id, e.target.checked)}
                      disabled={!item.canReturn}
                    />
                  </div>
                  
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <div className="item-specs">
                      {item.size && <span>{lang === 'ar' ? 'المقاس:' : 'Size:'} {item.size}</span>}
                      {item.color && <span>{lang === 'ar' ? 'اللون:' : 'Color:'} {item.color}</span>}
                    </div>
                    <div className="item-price">{item.price} {lang === 'ar' ? 'ج.م' : 'EGP'}</div>
                    <div className="item-quantity">
                      {lang === 'ar' ? 'الكمية:' : 'Quantity:'} {item.quantity}
                    </div>
                    
                    {!item.canReturn && (
                      <div className="cannot-return">
                        <FiInfo size={16} />
                        <span>
                          {lang === 'ar' ? 'لا يمكن إرجاع هذا المنتج' : 'This item cannot be returned'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {formData.items.length === 0 && (
              <div className="no-items-selected">
                <FiPackage size={48} />
                <p>
                  {lang === 'ar' 
                    ? 'لم تختر أي منتجات للإرجاع بعد'
                    : 'No items selected for return yet'
                  }
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3>{lang === 'ar' ? 'تفاصيل الإرجاع' : 'Return Details'}</h3>
            <p className="step-description">
              {lang === 'ar' 
                ? 'أدخل سبب الإرجاع وحالة المنتج لكل عنصر'
                : 'Enter the reason for return and condition for each item'
              }
            </p>

            <div className="return-items">
              {formData.items.map(returnItem => {
                const orderItem = order.items.find(item => item.id === returnItem.orderItemId);
                if (!orderItem) return null;

                return (
                  <div key={returnItem.orderItemId} className="return-item">
                    <div className="item-header">
                      <img src={orderItem.image} alt={orderItem.name} />
                      <div>
                        <h4>{orderItem.name}</h4>
                        <div className="item-specs">
                          {orderItem.size && <span>{lang === 'ar' ? 'المقاس:' : 'Size:'} {orderItem.size}</span>}
                          {orderItem.color && <span>{lang === 'ar' ? 'اللون:' : 'Color:'} {orderItem.color}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="return-details">
                      <div className="form-group">
                        <label>{lang === 'ar' ? 'الكمية المرجعة' : 'Return Quantity'}</label>
                        <select
                          value={returnItem.quantity}
                          onChange={(e) => updateItemReturn(returnItem.orderItemId, 'quantity', parseInt(e.target.value))}
                        >
                          {Array.from({ length: orderItem.quantity }, (_, i) => i + 1).map(qty => (
                            <option key={qty} value={qty}>{qty}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{lang === 'ar' ? 'سبب الإرجاع' : 'Return Reason'} *</label>
                        <select
                          value={returnItem.reason}
                          onChange={(e) => updateItemReturn(returnItem.orderItemId, 'reason', e.target.value)}
                          required
                        >
                          <option value="">
                            {lang === 'ar' ? 'اختر السبب' : 'Select Reason'}
                          </option>
                          {returnReasons.map(reason => (
                            <option key={reason.value} value={reason.value}>
                              {reason.label[lang]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{lang === 'ar' ? 'حالة المنتج' : 'Product Condition'} *</label>
                        <select
                          value={returnItem.condition}
                          onChange={(e) => updateItemReturn(returnItem.orderItemId, 'condition', e.target.value)}
                          required
                        >
                          {conditionOptions.map(condition => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label[lang]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{lang === 'ar' ? 'وصف إضافي (اختياري)' : 'Additional Description (Optional)'}</label>
                        <textarea
                          value={returnItem.description}
                          onChange={(e) => updateItemReturn(returnItem.orderItemId, 'description', e.target.value)}
                          placeholder={lang === 'ar' 
                            ? 'أضف أي تفاصيل إضافية...'
                            : 'Add any additional details...'
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Upload */}
            <div className="image-upload-section">
              <h4>{lang === 'ar' ? 'صور المنتجات (اختياري)' : 'Product Images (Optional)'}</h4>
              <p>
                {lang === 'ar' 
                  ? 'أضف صور للمنتجات لتسريع عملية المراجعة'
                  : 'Add product images to speed up the review process'
                }
              </p>

              <div className="image-upload">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="images" className="upload-button">
                  <FiUpload />
                  {lang === 'ar' ? 'رفع الصور' : 'Upload Images'}
                </label>
                <span className="upload-info">
                  {lang === 'ar' ? 'حد أقصى 5 صور، 10 ميجابايت لكل صورة' : 'Max 5 images, 10MB each'}
                </span>
              </div>

              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  {formData.images.map((image, index) => (
                    <div key={index} className="uploaded-image">
                      <img src={URL.createObjectURL(image)} alt={`Upload ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3>{lang === 'ar' ? 'طريقة الإرجاع' : 'Return Method'}</h3>
            <p className="step-description">
              {lang === 'ar' 
                ? 'اختر كيف تريد إرجاع المنتجات'
                : 'Choose how you want to return the products'
              }
            </p>

            <div className="return-methods">
              <div className="method-option">
                <input
                  type="radio"
                  id="pickup"
                  name="returnMethod"
                  value="PICKUP"
                  checked={formData.returnMethod === 'PICKUP'}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnMethod: e.target.value as 'PICKUP' | 'DROP_OFF' }))}
                />
                <label htmlFor="pickup" className="method-card">
                  <div className="method-icon">
                    <FiPackage />
                  </div>
                  <div className="method-details">
                    <h4>{lang === 'ar' ? 'استلام من المنزل' : 'Home Pickup'}</h4>
                    <p>
                      {lang === 'ar' 
                        ? 'سنأتي لاستلام المنتجات من عنوانك (مجاناً)'
                        : 'We will pick up the products from your address (Free)'
                      }
                    </p>
                  </div>
                </label>
              </div>

              <div className="method-option">
                <input
                  type="radio"
                  id="drop_off"
                  name="returnMethod"
                  value="DROP_OFF"
                  checked={formData.returnMethod === 'DROP_OFF'}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnMethod: e.target.value as 'PICKUP' | 'DROP_OFF' }))}
                />
                <label htmlFor="drop_off" className="method-card">
                  <div className="method-icon">
                    <FiCamera />
                  </div>
                  <div className="method-details">
                    <h4>{lang === 'ar' ? 'التسليم في المتجر' : 'Store Drop-off'}</h4>
                    <p>
                      {lang === 'ar' 
                        ? 'احضر المنتجات إلى متجرنا في القاهرة'
                        : 'Bring the products to our store in Cairo'
                      }
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Bank Details for Refund */}
            <div className="bank-details-section">
              <h4>{lang === 'ar' ? 'بيانات الحساب البنكي للاسترداد' : 'Bank Account for Refund'}</h4>
              <p>
                {lang === 'ar' 
                  ? 'أدخل بيانات حسابك البنكي لاسترداد المبلغ'
                  : 'Enter your bank account details for refund'
                }
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label>{lang === 'ar' ? 'رقم الحساب' : 'Account Number'} *</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountNumber || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountNumber: e.target.value,
                        accountName: prev.bankDetails?.accountName || '',
                        bankName: prev.bankDetails?.bankName || ''
                      }
                    }))}
                    placeholder={lang === 'ar' ? 'أدخل رقم الحساب' : 'Enter account number'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name'} *</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountName || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountName: e.target.value,
                        accountNumber: prev.bankDetails?.accountNumber || '',
                        bankName: prev.bankDetails?.bankName || ''
                      }
                    }))}
                    placeholder={lang === 'ar' ? 'أدخل اسم صاحب الحساب' : 'Enter account holder name'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'ar' ? 'اسم البنك' : 'Bank Name'} *</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        bankName: e.target.value,
                        accountNumber: prev.bankDetails?.accountNumber || '',
                        accountName: prev.bankDetails?.accountName || ''
                      }
                    }))}
                    placeholder={lang === 'ar' ? 'أدخل اسم البنك' : 'Enter bank name'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'ar' ? 'رقم الآيبان (اختياري)' : 'IBAN (Optional)'}</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.iban || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        iban: e.target.value,
                        accountNumber: prev.bankDetails?.accountNumber || '',
                        accountName: prev.bankDetails?.accountName || '',
                        bankName: prev.bankDetails?.bankName || ''
                      }
                    }))}
                    placeholder={lang === 'ar' ? 'أدخل رقم الآيبان' : 'Enter IBAN'}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="return-request-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft />
            {lang === 'ar' ? 'العودة' : 'Back'}
          </button>
          
          <div className="header-content">
            <h1>{lang === 'ar' ? 'طلب إرجاع' : 'Return Request'}</h1>
            <p>
              {lang === 'ar' ? 'رقم الطلب:' : 'Order Number:'} {order.orderNumber}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {[1, 2, 3].map(stepNumber => (
            <div
              key={stepNumber}
              className={`progress-step ${step >= stepNumber ? 'active' : ''} ${step > stepNumber ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {step > stepNumber ? <FiCheck /> : stepNumber}
              </div>
              <div className="step-label">
                {stepNumber === 1 && (lang === 'ar' ? 'اختيار المنتجات' : 'Select Items')}
                {stepNumber === 2 && (lang === 'ar' ? 'تفاصيل الإرجاع' : 'Return Details')}
                {stepNumber === 3 && (lang === 'ar' ? 'طريقة الإرجاع' : 'Return Method')}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <GlassCard className="step-card">
          {renderStepContent()}
        </GlassCard>

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <GlassButton
              variant="secondary"
              onClick={() => setStep(step - 1)}
            >
              {lang === 'ar' ? 'السابق' : 'Previous'}
            </GlassButton>
          )}

          {step < 3 ? (
            <GlassButton
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={!validateStep(step)}
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              onClick={submitReturn}
              loading={submitting}
              disabled={!validateStep(step)}
            >
              {submitting 
                ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                : (lang === 'ar' ? 'إرسال طلب الإرجاع' : 'Submit Return Request')
              }
            </GlassButton>
          )}
        </div>
      </div>

      <style jsx>{`
        .return-request-page {
          min-height: 100vh;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--glass-bg);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 0.75rem 1rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }

        .header-content h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .header-content p {
          color: var(--text-secondary);
          margin: 0;
        }

        .progress-steps {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .progress-steps::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20%;
          right: 20%;
          height: 2px;
          background: var(--border-primary);
          z-index: 1;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 200px;
          position: relative;
          z-index: 2;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--glass-bg);
          border: 2px solid var(--border-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-circle {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .progress-step.completed .step-circle {
          background: var(--success);
          border-color: var(--success);
          color: white;
        }

        .step-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .progress-step.active .step-label {
          color: var(--primary);
          font-weight: 500;
        }

        .step-card {
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .step-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          transition: all 0.3s ease;
        }

        .order-item:hover {
          border-color: var(--primary-200);
        }

        .item-checkbox input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        .item-image img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .item-details {
          flex: 1;
        }

        .item-details h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .item-specs {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .item-specs span {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .item-price {
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 0.25rem;
        }

        .item-quantity {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .cannot-return {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--warning);
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .no-items-selected {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
        }

        .no-items-selected svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .return-items {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .return-item {
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .item-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .item-header img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }

        .return-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group select,
        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          color: var(--text-primary);
          transition: all 0.3s ease;
        }

        .form-group select:focus,
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-100);
        }

        .image-upload-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-primary);
        }

        .image-upload-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .image-upload-section p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .image-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .upload-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--primary-100);
          border: 2px dashed var(--primary);
          border-radius: var(--radius-lg);
          color: var(--primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-button:hover {
          background: var(--primary-200);
        }

        .upload-info {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .uploaded-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
          max-width: 600px;
        }

        .uploaded-image {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .uploaded-image img {
          width: 100%;
          height: 100px;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
          width: 24px;
          height: 24px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .return-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .method-option input[type="radio"] {
          display: none;
        }

        .method-card {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .method-option input:checked + .method-card {
          border-color: var(--primary);
          background: var(--primary-50);
        }

        .method-icon {
          width: 48px;
          height: 48px;
          background: var(--primary-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .method-details h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .method-details p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .bank-details-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-primary);
        }

        .bank-details-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .bank-details-section p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .step-navigation {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-primary);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .error-card {
          text-align: center;
          padding: 3rem 2rem;
        }

        .error-card svg {
          color: var(--error);
          margin-bottom: 1rem;
        }

        .error-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .error-card p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .progress-steps {
            flex-direction: column;
            gap: 1rem;
          }

          .progress-steps::before {
            display: none;
          }

          .step-card {
            padding: 1.5rem;
          }

          .order-item {
            flex-direction: column;
          }

          .item-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .return-details {
            grid-template-columns: 1fr;
          }

          .return-methods {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .step-navigation {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ReturnRequestPage;
