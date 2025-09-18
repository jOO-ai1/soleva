import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiMail } from 'react-icons/hi';
import { HiLockClosed } from 'react-icons/hi';
import { HiEye } from 'react-icons/hi';
import { HiEyeOff } from 'react-icons/hi';
import { HiArrowLeft } from 'react-icons/hi';

// Import React hooks
const { useState } = React;
import { useToast } from '../contexts/ToastContext';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useAuthSafe } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const { lang } = useLang();
  const t = useTranslation();
  const auth = useAuthSafe();
  const forgotPassword = auth?.forgotPassword;
  const resetPassword = auth?.resetPassword;

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    token: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateRequestForm() {
    const newErrors: any = {};

    if (!formData.email) {
      newErrors.email = t("requiredField");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = lang === "ar" ? "البريد الإلكتروني غير صحيح" : "Invalid email format";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t("requiredField");
    } else {
      // Basic phone validation
      const phoneRegex = /^(\+?[1-9]\d{1,14}|0[0-9]{10,11})$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = lang === "ar" ? "رقم الهاتف غير صحيح" : "Invalid phone number format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateResetForm() {
    const newErrors: any = {};

    if (!formData.token) {
      newErrors.token = t("requiredField");
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t("requiredField");
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = lang === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("requiredField");
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = lang === "ar" ? "كلمة المرور غير متطابقة" : "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleInputChange(field: string, value: string) {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  }

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();

    if (!validateRequestForm()) return;

    setIsLoading(true);

    try {
      if (!forgotPassword) {
        showToast(lang === "ar" ? "خطأ في النظام" : "System error");
        return;
      }

      const response = await forgotPassword(formData.email, formData.phoneNumber);

      if (response.success) {
        showToast(lang === "ar" ? "تم التحقق من البيانات، يمكنك الآن تعيين كلمة مرور جديدة" : "Verification successful. You can now set a new password");
        setStep('reset');
      } else {
        showToast(lang === "ar" ? "رقم الهاتف أو البريد الإلكتروني غير صحيح" : "Invalid phone or email");
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      showToast(lang === "ar" ? "رقم الهاتف أو البريد الإلكتروني غير صحيح" : "Invalid phone or email");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!validateResetForm()) return;

    setIsLoading(true);

    try {
      if (!resetPassword) {
        showToast(lang === "ar" ? "خطأ في النظام" : "System error");
        return;
      }

      const response = await resetPassword(formData.token, formData.newPassword);

      if (response.success) {
        showToast(lang === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
        // Redirect to login page
        window.location.href = '/login';
      } else {
        showToast(lang === "ar" ? "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية" : "Invalid or expired reset token");
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      showToast(lang === "ar" ? "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية" : "Invalid or expired reset token");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-md mx-auto">

        <GlassCard>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-[#d1b16a]/20 rounded-full flex items-center justify-center mx-auto mb-4">

              <HiLockClosed size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 text-[#111]">
              {step === 'request' ?
              lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?" :
              lang === "ar" ? "تعيين كلمة مرور جديدة" : "Set New Password"
              }
            </h1>
            <p className="text-gray-600">
              {step === 'request' ?
              lang === "ar" ? "أدخل بريدك الإلكتروني ورقم هاتفك لإعادة تعيين كلمة المرور" : "Enter your email and phone number to reset your password" :
              lang === "ar" ? "أدخل الرمز وكلمة المرور الجديدة" : "Enter the code and your new password"
              }
            </p>
          </div>

          {step === 'request' ?
          <form onSubmit={handleRequestReset} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("email")}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiMail size={20} />
                  </div>
                  <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                  errors.email ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                  }
                  placeholder={lang === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"} />

                </div>
                {errors.email &&
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              }
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                  errors.phoneNumber ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                  }
                  placeholder={lang === "ar" ? "أدخل رقم هاتفك" : "Enter your phone number"} />

                </div>
                {errors.phoneNumber &&
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              }
              </div>

              <button
              type="submit"
              className="w-full bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80 min-h-[52px] font-bold hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2"
              disabled={isLoading}>

                {isLoading ?
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" /> :

              <>
                    <HiLockClosed />
                    {lang === "ar" ? "تحقق من البيانات" : "Verify Information"}
                  </>
              }
              </button>
            </form> :

          <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Reset Token Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === "ar" ? "رمز إعادة التعيين" : "Reset Code"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiLockClosed size={20} />
                  </div>
                  <input
                  type="text"
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                  errors.token ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                  }
                  placeholder={lang === "ar" ? "أدخل رمز إعادة التعيين" : "Enter reset code"} />

                </div>
                {errors.token &&
              <p className="text-red-500 text-sm mt-1">{errors.token}</p>
              }
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiLockClosed size={20} />
                  </div>
                  <input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                  errors.newPassword ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                  }
                  placeholder={lang === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"} />

                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">

                    {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
                {errors.newPassword &&
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
              }
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiLockClosed size={20} />
                  </div>
                  <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                  errors.confirmPassword ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                  }
                  placeholder={lang === "ar" ? "أعد كتابة كلمة المرور" : "Confirm your password"} />

                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">

                    {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword &&
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              }
              </div>

              <button
              type="submit"
              className="w-full bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80 min-h-[52px] font-bold hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2"
              disabled={isLoading}>

                {isLoading ?
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" /> :

              <>
                    <HiLockClosed />
                    {lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                  </>
              }
              </button>
            </form>
          }

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-[#d1b16a] hover:text-[#d1b16a]/80 font-semibold transition-colors flex items-center justify-center gap-2">

              <HiArrowLeft />
              {lang === "ar" ? "العودة لتسجيل الدخول" : "Back to Login"}
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>);

}