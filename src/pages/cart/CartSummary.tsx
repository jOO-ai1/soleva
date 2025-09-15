import { useState } from 'react';
import { FiCreditCard, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useLang, useTranslation } from '../../contexts/LangContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import AuthWarningModal from '../../components/AuthWarningModal';
import { COUPONS } from '../../constants/brand';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import EmptyCartConfirmModal from './EmptyCartConfirmModal';

export default function CartSummary() {
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = useTranslation();
  
  const {
    showWarning,
    warningType,
    actionDescription,
    handleLoginClick,
    handleSignUpClick,
    handleCloseWarning
  } = useAuthGuard();

  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState<any>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const handleApplyCoupon = () => {
    const found = COUPONS.find(c => c.code.toUpperCase() === coupon.trim().toUpperCase());
    if (!found) {
      showToast(t("invalidCoupon"));
      setApplied(null);
    } else {
      setApplied(found);
      showToast(t("couponApplied"));
    }
  };

  const handleEmptyCart = () => {
    setShowEmptyConfirm(true);
  };

  const confirmEmptyCart = () => {
    clearCart();
    setShowEmptyConfirm(false);
    showToast(t("cartEmptied"));
  };

  const handleCheckout = () => {
    // Allow guests to proceed to checkout
    navigate("/checkout", { state: { appliedCoupon: applied } });
  };
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = applied?.discount ? Math.min(Math.floor((subtotal * applied.discount) / 100), applied.maxDiscount || Infinity) : 0;
  const shipping = applied?.freeShipping ? 0 : 60;
  const total = subtotal - discount + (cart.length > 0 ? shipping : 0);

  return (
    <>
      <GlassCard>
      <h3 className="text-xl font-bold mb-6">{t("total")}</h3>

      {/* Coupon */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 mb-3">
          <input
            className="w-full glass border border-[#d1b16a]/40 px-4 py-3 rounded-xl font-montserrat text-base min-h-[52px] focus:outline-none focus:ring-2 focus:ring-[#d1b16a] transition-all"
            placeholder={lang === 'ar' ? "أدخل كود الكوبون" : "Enter coupon code"}
            value={coupon}
            onChange={e => setCoupon(e.target.value)}
            disabled={!!applied}
          />
          <GlassButton 
            onClick={handleApplyCoupon}
            className="w-full"
            disabled={!!applied}
          >
            {applied ? t("applied") : t("applyCoupon")}
          </GlassButton>
        </div>
        {applied && (
          <div className="text-green-600 font-semibold text-sm bg-green-50 p-2 rounded-lg">
            ✓ {applied.desc[lang]}
          </div>
        )}
      </div>

      {/* Prices */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between">
          <span>{lang === "ar" ? "الإجمالي قبل الخصم" : "Subtotal"}:</span>
          <span className="font-bold">{subtotal} {t("egp")}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t("couponDiscount")}:</span>
            <span className="font-bold">-{discount} {t("egp")}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("shipping")}:</span>
          <span className="font-bold">
            {shipping === 0 ? t("free") : `${shipping} ${t("egp")}`}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between text-xl font-bold mb-6">
        <span>{t("total")}:</span>
        <span className="text-[#d1b16a]">{total} {t("egp")}</span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <GlassButton 
          onClick={handleCheckout}
          className="w-full bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80"
        >
          <FiCreditCard />
          {t("checkout")}
        </GlassButton>

        <GlassButton 
          className="w-full bg-red-500 text-white hover:bg-red-600 border-none" 
          onClick={handleEmptyCart}
        >
          <FiTrash2 />
          {t("emptyCart")}
        </GlassButton>
      </div>
      </GlassCard>

      {/* Empty Cart Confirmation Modal */}
      {showEmptyConfirm && (
        <EmptyCartConfirmModal 
          onCancel={() => setShowEmptyConfirm(false)} 
          onConfirm={confirmEmptyCart} 
        />
      )}
      
      {/* Auth Warning Modal */}
      <AuthWarningModal
        isOpen={showWarning}
        onClose={handleCloseWarning}
        onLogin={handleLoginClick}
        onSignUp={handleSignUpClick}
        type={warningType}
        action={actionDescription}
      />
    </>
  );
}
