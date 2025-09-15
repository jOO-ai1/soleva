import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiMail, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import AuthWarningModal from '../components/AuthWarningModal';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import SocialLogin from '../components/SocialLogin';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });
      
      if (result.success) {
        showToast(lang === "ar" ? "تم إنشاء الحساب بنجاح" : "Account created successfully");
        // Execute pending action if there was one, otherwise go to account
        const actionExecuted = executePendingAction();
        if (!actionExecuted) {
          navigate("/account");
        }
      } else {
        showToast(result.message || (lang === "ar" ? "فشل في إنشاء الحساب" : "Registration failed"));
      }
    } catch (error) {
      showToast(lang === "ar" ? "حدث خطأ أثناء إنشاء الحساب" : "Registration failed");
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
        className="max-w-md mx-auto"
      >
        <GlassCard>
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-[#d1b16a]/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiUserPlus size={32} className="text-[#d1b16a]" />
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
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                    errors.name ? 'border-red-400' : 'border-[#d1b16a]/40'
                  }`}
                  placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("email")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiMail size={20} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                    errors.email ? 'border-red-400' : 'border-[#d1b16a]/40'
                  }`}
                  placeholder={lang === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("password")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                    errors.password ? 'border-red-400' : 'border-[#d1b16a]/40'
                  }`}
                  placeholder={lang === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("confirmPassword")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={e => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full glass border rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all ${
                    errors.confirmPassword ? 'border-red-400' : 'border-[#d1b16a]/40'
                  }`}
                  placeholder={lang === "ar" ? "أعد كتابة كلمة المرور" : "Confirm your password"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <GlassButton 
              type="submit" 
              className="w-full bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80 min-h-[52px] font-bold hover:scale-105 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <FiUserPlus />
                  {t("createAccount")}
                </>
              )}
            </GlassButton>
          </form>

          <SocialLogin mode="register" onSuccess={() => navigate("/account")} />

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t("alreadyAccount")}
            </p>
            <Link 
              to="/login" 
              className="text-[#d1b16a] hover:text-[#d1b16a]/80 font-semibold transition-colors"
            >
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
        type={warningType}
      />
    </div>
  );
}