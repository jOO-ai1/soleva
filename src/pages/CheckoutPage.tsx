import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiUser, FiMapPin, FiPhone, FiDollarSign, FiSmartphone, FiZap, FiUpload } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useLang, useTranslation } from '../contexts/LangContext';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { lang } = useLang();
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const applied = location.state?.appliedCoupon || null;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    primaryPhone: "",
    secondaryPhone: "",
    paymentMethod: "cash",
    senderNumber: "",
    paymentScreenshot: null as File | null
  });

  const [error, setError] = useState("");
  // const [isUploading, setIsUploading] = useState(false); // Removed as it's not used

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = applied?.discount ? Math.min(Math.floor((subtotal * applied.discount) / 100), applied.maxDiscount || Infinity) : 0;
  const shipping = applied?.freeShipping ? 0 : 60;
  const total = subtotal - discount + (cart.length > 0 ? shipping : 0);

  const paymentMethods = [
    {
      id: "cash",
      name: t("cashOnDelivery"),
      icon: <FiDollarSign />,
      desc: lang === "ar" ? "ادفع عند استلام الطلب" : "Pay when you receive your order"
    },
    {
      id: "bank",
      name: t("bankWallet"),
      icon: <FiCreditCard />,
      desc: lang === "ar" ? "الدفع عبر محفظة البنك" : "Pay through bank wallet"
    },
    {
      id: "digital",
      name: t("digitalWallet"),
      icon: <FiZap />,
      desc: lang === "ar" ? "الدفع عبر المحفظة الرقمية" : "Pay through digital wallet"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (formData.name.trim().length < 3) {
      return setError(lang === "ar" ? "الاسم يجب أن يحتوي على 3 حروف على الأقل" : "Name must be at least 3 characters");
    }
    if (formData.primaryPhone.trim().length < 10) {
      return setError(lang === "ar" ? "رقم الهاتف الأساسي غير صحيح" : "Invalid primary phone number");
    }
    if (formData.address.trim().length < 10) {
      return setError(lang === "ar" ? "العنوان يجب أن يكون مفصلاً أكثر" : "Address must be more detailed");
    }
    
    // Validate payment method specific fields
    if (formData.paymentMethod !== "cash") {
      if (formData.paymentMethod === "digital" && !formData.senderNumber.trim()) {
        return setError(lang === "ar" ? "يرجى إدخال رقم المرسل" : "Please enter sender number");
      }
      if (!formData.paymentScreenshot) {
        return setError(lang === "ar" ? "يرجى رفع لقطة شاشة للدفع" : "Please upload payment screenshot");
      }
    }

    setError("");
    
    if (formData.paymentMethod !== "cash") {
      // Show payment under review message
      alert(lang === "ar" 
        ? "دفعتك قيد المراجعة. سيتم إشعارك قريباً." 
        : "Your payment is under review. You will be notified shortly."
      );
    }
    
    clearCart();
    setFormData({ 
      name: "", 
      address: "", 
      primaryPhone: "", 
      secondaryPhone: "", 
      paymentMethod: "cash",
      senderNumber: "",
      paymentScreenshot: null
    });
    navigate("/order-confirmation", { state: { ...formData, total } });
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-xl">{t("empty")}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="container mx-auto py-6 sm:py-10 px-4 max-w-4xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center font-montserrat">{t("checkout")}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  {t("fullName")}
                </label>
                <input
                  required
                  className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] min-w-0"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiPhone className="inline mr-2" />
                    {t("primaryPhone")}
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] min-w-0"
                    value={formData.primaryPhone}
                    onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
                    placeholder={lang === "ar" ? "رقم الهاتف الأساسي" : "Primary phone number"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FiSmartphone className="inline mr-2" />
                    {t("secondaryPhone")}
                  </label>
                  <input
                    type="tel"
                    className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] min-w-0"
                    value={formData.secondaryPhone}
                    onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    placeholder={lang === "ar" ? "رقم هاتف إضافي" : "Secondary phone number"}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiMapPin className="inline mr-2" />
                  {t("address")}
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] resize-none min-w-0"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder={lang === "ar" ? "أدخل عنوانك كاملاً مع تفاصيل الوصول" : "Enter your complete address with delivery details"}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  <FiCreditCard className="inline mr-2" />
                  {t("paymentMethod")}
                </label>
                <div className="payment-methods-grid grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`payment-method-card glass p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paymentMethod === method.id
                          ? 'selected border-[#d1b16a] bg-[#d1b16a]/10'
                          : 'border-gray-200 hover:border-[#d1b16a]/50'
                      }`}
                      onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`text-2xl mb-2 ${formData.paymentMethod === method.id ? 'text-[#d1b16a]' : 'text-gray-400'}`}>
                          {method.icon}
                        </div>
                        <div className="font-semibold text-sm mb-1">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Payment Details for E-wallet and Bank */}
              {formData.paymentMethod !== "cash" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Payment Information Display */}
                  <div>
                    <div className="glass p-4 rounded-xl bg-[#d1b16a]/10 border border-[#d1b16a]/30">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        {formData.paymentMethod === "digital" 
                          ? (lang === "ar" ? "معلومات المحفظة الرقمية" : "Digital Wallet Information")
                          : (lang === "ar" ? "معلومات التحويل البنكي" : "Bank Transfer Information")
                        }
                      </h4>
                      <div className="text-lg font-bold text-[#d1b16a] mb-2">
                        {formData.paymentMethod === "digital" 
                          ? (lang === "ar" ? "رقم المحفظة: " : "Wallet Number: ") + "01028354015"
                          : (lang === "ar" ? "رقم البطاقة: " : "Card Number: ") + "5264 3999 9797 28173"
                        }
                      </div>
                      <p className="text-sm text-gray-600">
                        {lang === "ar" 
                          ? "يرجى إرسال المبلغ إلى الرقم أعلاه ثم رفع لقطة شاشة للتأكيد"
                          : "Please send the amount to the number above and upload a screenshot for confirmation"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Sender Number - Only for Digital Wallet */}
                  {formData.paymentMethod === "digital" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {lang === "ar" ? "رقم المرسل المستخدم للتحويل" : "Sender Number Used for Transfer"}
                      </label>
                      <input
                        required
                        type="tel"
                        className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] min-w-0"
                        value={formData.senderNumber}
                        onChange={e => setFormData({ ...formData, senderNumber: e.target.value })}
                        placeholder={lang === "ar" ? "رقم الهاتف المستخدم للدفع" : "Phone number used for payment"}
                      />
                    </div>
                  )}

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FiUpload className="inline mr-2" />
                      {lang === "ar" ? "لقطة شاشة للدفع" : "Payment Screenshot"}
                    </label>
                    <input
                      required
                      type="file"
                      accept="image/*"
                      className="w-full glass border border-[#d1b16a]/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d1b16a] min-w-0"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setFormData({ ...formData, paymentScreenshot: file });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === "ar" 
                        ? "يرجى رفع لقطة شاشة تؤكد عملية الدفع" 
                        : "Please upload a screenshot confirming the payment"
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <GlassButton
                type="submit"
                className="w-full bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80 text-lg sm:text-xl py-4 min-h-[56px] font-bold hover:scale-105 transition-all duration-300"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCreditCard size={24} />
                    {t("placeOrder")}
                  </>
                )}
              </GlassButton>
            </form>
          </GlassCard>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-24">
            <h3 className="text-xl font-bold mb-6">{t("total")}</h3>

            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {cart.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 glass rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.name[lang]}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{item.name[lang]}</div>
                    <div className="text-xs text-gray-500">
                      {item.color} • {item.size} • x{item.qty}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#d1b16a]">
                    {item.price * item.qty} {t("egp")}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass p-4 rounded-xl bg-gray-50/50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{lang === "ar" ? "الإجمالي قبل الخصم" : "Subtotal"}:</span>
                  <span>{subtotal} {t("egp")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t("couponDiscount")} ({applied.code.toUpperCase()}):</span>
                    <span>-{discount} {t("egp")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("shipping")}:</span>
                  <span>{shipping === 0 ? t("free") : `${shipping} ${t("egp")}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t("total")}:</span>
                  <span className="text-[#d1b16a]">{total} {t("egp")}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}