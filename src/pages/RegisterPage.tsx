import * as React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { HiLockClosed } from 'react-icons/hi';
import { HiMail } from 'react-icons/hi';
import { HiUsers } from 'react-icons/hi';
import { HiEye } from 'react-icons/hi';
import { HiEyeOff } from 'react-icons/hi';

// Import React hooks
const { useState } = React;
import { useAuthSafe } from '../contexts/AuthContext';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import AuthWarningModal from '../components/AuthWarningModal';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import SocialLogin from '../components/SocialLogin';

export default function RegisterPage() {
  const auth = useAuthSafe();
  const register = auth?.register;
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = useTranslation();

  const {
    showWarning,
    warningType,
    handleLoginClick,
    handleSignUpClick,
    handleCloseWarning,
    executePendingAction
  } = useAuthGuard();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    const newErrors: any = {};

    if (!formData.name) {
      newErrors.name = t("requiredField");
    } else if (formData.name.length < 2) {
      newErrors.name = lang === "ar" ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = t("requiredField");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = lang === "ar" ? "البريد الإلكتروني غير صحيح" : "Invalid email format";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t("requiredField");
    } else {
      // Basic phone validation - should start with + or be a valid format
      const phoneRegex = /^(\+?[1-9]\d{1,14}|0[0-9]{10,11})$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = lang === "ar" ? "رقم الهاتف غير صحيح" : "Invalid phone number format";
      }
    }

    if (!formData.password) {
      newErrors.password = t("requiredField");
    } else if (formData.password.length < 6) {
      newErrors.password = lang === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("requiredField");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = lang === "ar" ? "كلمة المرور غير متطابقة" : "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleInputChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    if (!register) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });

      if (result.success) {
        if (result.requiresVerification) {


































          // Don't navigate to account page, show verification message instead
        } else {// Execute pending action if there was one, otherwise go to account
          const actionExecuted = executePendingAction();if (!actionExecuted) {navigate("/account");}}}} catch (error: any) {console.error('Registration error:', error); // Error handling is now done by the AuthContext with notification banners
    } finally {setIsLoading(false);}}return <div className="container mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} className="max-w-md mx-auto">

        <GlassCard>
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-[#d1b16a]/20 rounded-full flex items-center justify-center mx-auto mb-4">

              <HiUsers size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 text-[#111]">{t("register")}</h1>
            <p className="text-gray-600">
              {lang === "ar" ? "انضم إلى مجتمع سوليفا" : "Join the Soleva community"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("fullName")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiUser size={20} />
                </div>
                <input type="text" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)} className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${errors.name ? 'border-red-400' : 'border-[#d1b16a]/40'}`} placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"} />

              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("email")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiMail size={20} />
                </div>
                <input type="email" value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                errors.phoneNumber ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                }
                placeholder={lang === "ar" ? "أدخل رقم هاتفك" : "Enter your phone number"} />

              </div>
              {errors.phoneNumber &&
            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            }
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("password")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiLockClosed size={20} />
                </div>
                <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                errors.password ? 'border-red-400' : 'border-[#d1b16a]/40'}`
                }
                placeholder={lang === "ar" ? "أدخل كلمة المرور" : "Enter your password"} />

                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">

                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
              {errors.password &&
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            }
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("confirmPassword")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <HiLockClosed size={20} />
                </div>
                <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('confirmPassword', e.target.value)}
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
                  <HiUsers />
                  {t("createAccount")}
                </>
            }
            </button>
          </form>

          <SocialLogin mode="register" onSuccess={() => navigate("/account")} />

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t("alreadyAccount")}
            </p>
            <Link
            to="/login"
            className="text-[#d1b16a] hover:text-[#d1b16a]/80 font-semibold transition-colors">

              {t("login")}
            </Link>
          </div>
        </GlassCard>
      </motion.div>
      
      {/* Auth Warning Modal */}
      <AuthWarningModal
      isOpen={showWarning}
      onClose={handleCloseWarning}
      onLogin={handleLoginClick}
      onSignUp={handleSignUpClick}
      type={warningType} />

    </div>;

}