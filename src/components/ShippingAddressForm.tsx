import React from 'react';
const { useState, useEffect, FormEvent } = React;
import { motion } from 'framer-motion';
import { FiMapPin, FiUser, FiHome, FiInfo } from 'react-icons/fi';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useToast } from '../contexts/ToastContext';
import GlassButton from './GlassButton';

interface GovernorateData {
  id: string;
  name: { ar: string; en: string };
  code: string;
  shippingCost: number;
  centers: CenterData[];
}

interface CenterData {
  id: string;
  name: { ar: string; en: string };
  code: string;
  shippingCost?: number;
  villages: VillageData[];
}

interface VillageData {
  id: string;
  name: { ar: string; en: string };
  code: string;
  type: 'KAFR' | 'EZBA' | 'SHEIKH' | 'VILLAGE';
  shippingCost?: number;
}

interface AddressFormData {
  recipientName: string;
  phone: string;
  secondaryPhone: string;
  governorateId: string;
  centerId: string;
  villageId: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  landmark: string;
  postalCode: string;
  instructions: string;
  isDefault: boolean;
}

interface ShippingAddressFormProps {
  initialData?: any;
  onSubmit: any;
  onCancel?: any;
  loading?: boolean;
}

const ShippingAddressForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}: ShippingAddressFormProps) => {
  const [formData, setFormData] = useState<AddressFormData>({
    recipientName: '',
    phone: '',
    secondaryPhone: '',
    governorateId: '',
    centerId: '',
    villageId: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    landmark: '',
    postalCode: '',
    instructions: '',
    isDefault: false,
    ...initialData
  });

  const [governorates, setGovernorates] = useState<GovernorateData[]>([]);
  const [centers, setCenters] = useState<CenterData[]>([]);
  const [villages, setVillages] = useState<VillageData[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { lang } = useLang();
  const { showToast } = useToast();

  // Function declarations
  const loadGovernorates = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/v1/shipping/governorates');
      const data = await response.json();
      
      if (data.success) {
        setGovernorates(data.data);
      }
    } catch (error) {
      console.error('Failed to load governorates:', error);
      showToast('Failed to load governorates');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCenters = async (governorateId: string) => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/v1/shipping/centers?governorateId=${governorateId}`);
      const data = await response.json();
      
      if (data.success) {
        setCenters(data.data);
      }
    } catch (error) {
      console.error('Failed to load centers:', error);
      showToast('Failed to load centers');
    } finally {
      setLoadingData(false);
    }
  };

  const loadVillages = async (centerId: string) => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/v1/shipping/villages?centerId=${centerId}`);
      const data = await response.json();
      
      if (data.success) {
        setVillages(data.data);
      }
    } catch (error) {
      console.error('Failed to load villages:', error);
      showToast('Failed to load villages');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateShippingCost = () => {
    if (!formData.governorateId) {
      setShippingCost(0);
      return;
    }
    
    const governorate = governorates.find((g: GovernorateData) => g.id === formData.governorateId);
    if (!governorate) {
      setShippingCost(0);
      return;
    }
    
    if (formData.centerId) {
      const center = governorate.centers.find((c: CenterData) => c.id === formData.centerId);
      if (center && center.shippingCost !== undefined) {
        setShippingCost(center.shippingCost);
        return;
      }
    }
    
    if (formData.villageId && formData.centerId) {
      const center = governorate.centers.find((c: CenterData) => c.id === formData.centerId);
      if (center) {
        const village = center.villages.find((v: VillageData) => v.id === formData.villageId);
        if (village && village.shippingCost !== undefined) {
          setShippingCost(village.shippingCost);
          return;
        }
      }
    }
    
    setShippingCost(governorate.shippingCost);
  };

  // Load governorates on component mount
  useEffect(() => {
    loadGovernorates();
  }, [loadGovernorates]);

  // Load centers when governorate changes
  useEffect(() => {
    if (formData.governorateId) {
      loadCenters(formData.governorateId);
      setFormData((prev: any) => ({ ...prev, centerId: '', villageId: '' }));
      setCenters([]);
      setVillages([]);
    }
  }, [formData.governorateId]);

  // Load villages when center changes
  useEffect(() => {
    if (formData.centerId) {
      loadVillages(formData.centerId);
      setFormData((prev: any) => ({ ...prev, villageId: '' }));
      setVillages([]);
    }
  }, [formData.centerId]);

  // Calculate shipping cost when address changes
  useEffect(() => {
    calculateShippingCost();
  }, [formData.governorateId, formData.centerId, formData.villageId]);


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = lang === 'ar' ? 'اسم المستلم مطلوب' : 'Recipient name is required';
    } else if (formData.recipientName.trim().length < 2) {
      newErrors.recipientName = lang === 'ar' ? 'اسم المستلم قصير جداً' : 'Recipient name is too short';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    } else if (!/^(010|011|012|015)\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number';
    }

    if (!formData.governorateId) {
      newErrors.governorateId = lang === 'ar' ? 'المحافظة مطلوبة' : 'Governorate is required';
    }

    if (!formData.centerId) {
      newErrors.centerId = lang === 'ar' ? 'المركز مطلوب' : 'Center is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = lang === 'ar' ? 'الشارع مطلوب' : 'Street is required';
    } else if (formData.street.trim().length < 5) {
      newErrors.street = lang === 'ar' ? 'عنوان الشارع قصير جداً' : 'Street address is too short';
    }

    if (formData.secondaryPhone && !/^(010|011|012|015)\d{8}$/.test(formData.secondaryPhone.replace(/\s/g, ''))) {
      newErrors.secondaryPhone = lang === 'ar' ? 'رقم الهاتف الإضافي غير صحيح' : 'Invalid secondary phone number';
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

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };


  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="shipping-address-form"
    >
      {/* Recipient Information */}
      <div className="form-section">
        <h3 className="section-title">
          <FiUser />
          {lang === 'ar' ? 'معلومات المستلم' : 'Recipient Information'}
        </h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="recipientName" className="form-label">
              {lang === 'ar' ? 'اسم المستلم' : 'Recipient Name'} *
            </label>
            <input
              type="text"
              id="recipientName"
              className={`form-input ${errors.recipientName ? 'error' : ''}`}
              value={formData.recipientName}
              onChange={(e) => handleInputChange('recipientName', e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسم المستلم' : 'Enter recipient name'}
            />
            {errors.recipientName && <span className="error-text">{errors.recipientName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
            </label>
            <input
              type="tel"
              id="phone"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={lang === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx'}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="secondaryPhone" className="form-label">
              {lang === 'ar' ? 'رقم هاتف إضافي' : 'Secondary Phone'} ({lang === 'ar' ? 'اختياري' : 'Optional'})
            </label>
            <input
              type="tel"
              id="secondaryPhone"
              className={`form-input ${errors.secondaryPhone ? 'error' : ''}`}
              value={formData.secondaryPhone}
              onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
              placeholder={lang === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx'}
            />
            {errors.secondaryPhone && <span className="error-text">{errors.secondaryPhone}</span>}
          </div>
        </div>
      </div>

      {/* Address Location */}
      <div className="form-section">
        <h3 className="section-title">
          <FiMapPin />
          {lang === 'ar' ? 'العنوان' : 'Address Location'}
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="governorate" className="form-label">
              {lang === 'ar' ? 'المحافظة' : 'Governorate'} *
            </label>
            <select
              id="governorate"
              className={`form-input ${errors.governorateId ? 'error' : ''}`}
              value={formData.governorateId}
              onChange={(e) => handleInputChange('governorateId', e.target.value)}
              disabled={loadingData}
            >
              <option value="">
                {loadingData 
                  ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...')
                  : (lang === 'ar' ? 'اختر المحافظة' : 'Select Governorate')
                }
              </option>
              {governorates.map((gov: GovernorateData) => (
                <option key={gov.id} value={gov.id}>
                  {(gov.name as any)[lang]} - {gov.shippingCost} {lang === 'ar' ? 'ج.م' : 'EGP'}
                </option>
              ))}
            </select>
            {errors.governorateId && <span className="error-text">{errors.governorateId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="center" className="form-label">
              {lang === 'ar' ? 'المركز' : 'Center'} *
            </label>
            <select
              id="center"
              className={`form-input ${errors.centerId ? 'error' : ''}`}
              value={formData.centerId}
              onChange={(e) => handleInputChange('centerId', e.target.value)}
              disabled={!formData.governorateId || centers.length === 0}
            >
              <option value="">
                {!formData.governorateId 
                  ? (lang === 'ar' ? 'اختر المحافظة أولاً' : 'Select governorate first')
                  : (lang === 'ar' ? 'اختر المركز' : 'Select Center')
                }
              </option>
              {centers.map((center: CenterData) => (
                <option key={center.id} value={center.id}>
                  {(center.name as any)[lang]}
                  {center.shippingCost && ` - ${center.shippingCost} ${lang === 'ar' ? 'ج.م' : 'EGP'}`}
                </option>
              ))}
            </select>
            {errors.centerId && <span className="error-text">{errors.centerId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="village" className="form-label">
              {lang === 'ar' ? 'القرية/الكفر/العزبة' : 'Village/Kafr/Ezba'} ({lang === 'ar' ? 'اختياري' : 'Optional'})
            </label>
            <select
              id="village"
              className="form-input"
              value={formData.villageId}
              onChange={(e) => handleInputChange('villageId', e.target.value)}
              disabled={!formData.centerId || villages.length === 0}
            >
              <option value="">
                {!formData.centerId 
                  ? (lang === 'ar' ? 'اختر المركز أولاً' : 'Select center first')
                  : (lang === 'ar' ? 'اختر القرية (اختياري)' : 'Select Village (Optional)')
                }
              </option>
              {villages.map((village: VillageData) => (
                <option key={village.id} value={village.id}>
                  {(village.name as any)[lang]} ({village.type})
                  {village.shippingCost && ` - ${village.shippingCost} ${lang === 'ar' ? 'ج.م' : 'EGP'}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shipping Cost Display */}
        {shippingCost > 0 && (
          <div className="shipping-cost-display">
            <FiInfo />
            <span>
              {lang === 'ar' ? 'تكلفة الشحن:' : 'Shipping Cost:'} <strong>{shippingCost} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong>
            </span>
            <small>
              {lang === 'ar' ? 'شحن مجاني للطلبات فوق 500 ج.م' : 'Free shipping on orders over 500 EGP'}
            </small>
          </div>
        )}
      </div>

      {/* Detailed Address */}
      <div className="form-section">
        <h3 className="section-title">
          <FiHome />
          {lang === 'ar' ? 'تفاصيل العنوان' : 'Address Details'}
        </h3>

        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="street" className="form-label">
              {lang === 'ar' ? 'الشارع' : 'Street'} *
            </label>
            <input
              type="text"
              id="street"
              className={`form-input ${errors.street ? 'error' : ''}`}
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder={lang === 'ar' ? 'اسم الشارع' : 'Street name'}
            />
            {errors.street && <span className="error-text">{errors.street}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="building" className="form-label">
              {lang === 'ar' ? 'رقم العقار/المبنى' : 'Building Number'}
            </label>
            <input
              type="text"
              id="building"
              className="form-input"
              value={formData.building}
              onChange={(e) => handleInputChange('building', e.target.value)}
              placeholder={lang === 'ar' ? 'رقم المبنى' : 'Building number'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="floor" className="form-label">
              {lang === 'ar' ? 'الدور' : 'Floor'}
            </label>
            <input
              type="text"
              id="floor"
              className="form-input"
              value={formData.floor}
              onChange={(e) => handleInputChange('floor', e.target.value)}
              placeholder={lang === 'ar' ? 'رقم الدور' : 'Floor number'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apartment" className="form-label">
              {lang === 'ar' ? 'رقم الشقة' : 'Apartment'}
            </label>
            <input
              type="text"
              id="apartment"
              className="form-input"
              value={formData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              placeholder={lang === 'ar' ? 'رقم الشقة' : 'Apartment number'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="landmark" className="form-label">
              {lang === 'ar' ? 'علامة مميزة' : 'Landmark'}
            </label>
            <input
              type="text"
              id="landmark"
              className="form-input"
              value={formData.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
              placeholder={lang === 'ar' ? 'مثل: بجوار مسجد النور' : 'e.g., Near Al Noor Mosque'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="postalCode" className="form-label">
              {lang === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
            </label>
            <input
              type="text"
              id="postalCode"
              className="form-input"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder={lang === 'ar' ? 'الرمز البريدي' : 'Postal code'}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="instructions" className="form-label">
              {lang === 'ar' ? 'تعليمات التوصيل' : 'Delivery Instructions'}
            </label>
            <textarea
              id="instructions"
              className="form-input"
              rows={3}
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder={lang === 'ar' 
                ? 'تعليمات إضافية للمندوب (مثل: اتصل قبل الوصول)' 
                : 'Additional instructions for delivery (e.g., call before arrival)'
              }
            />
          </div>
        </div>
      </div>

      {/* Default Address Option */}
      <div className="form-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => handleInputChange('isDefault', e.target.checked)}
          />
          <span className="checkbox-text">
            {lang === 'ar' ? 'جعل هذا العنوان الافتراضي' : 'Make this my default address'}
          </span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        )}
        
        <GlassButton
          variant="primary"
          loading={loading}
          className="submit-button"
        >
          {loading 
            ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
            : (lang === 'ar' ? 'حفظ العنوان' : 'Save Address')
          }
        </GlassButton>
      </div>

      <style>{`
        .shipping-address-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--glass-bg);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-xl);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
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

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-text {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .shipping-cost-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          border-radius: var(--radius-lg);
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .shipping-cost-display small {
          color: var(--text-secondary);
          font-size: 0.75rem;
          margin-left: auto;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .checkbox-label input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          accent-color: var(--primary);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .submit-button {
          min-width: 150px;
        }

        @media (max-width: 640px) {
          .form-actions {
            flex-direction: column;
          }
          
          .submit-button {
            min-width: auto;
          }
        }
      `}</style>
    </motion.form>
  );
};

export default ShippingAddressForm;
