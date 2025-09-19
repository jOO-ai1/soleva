import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

export default function SafeHome() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-lg text-center">
        <div className="container">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-8">
              <img
                src="/logo.png"
                alt="Soleva"
                className="h-16 w-auto transition-all duration-300 hover:scale-105 drop-shadow-sm object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
          
          <h1 className="mb-6">
            {lang === 'ar' ? 'مرحباً بك في سوليفا' : 'Welcome to Soleva'}
          </h1>
          
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            {lang === 'ar' ?
              'اكتشف مجموعة أحذية فاخرة بتصميم عصري وجودة لا مثيل لها' :
              'Discover premium footwear with modern design and unmatched quality'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/products">
              <GlassButton variant="primary" size="lg" className="w-full sm:w-auto">
                {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Features Section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              {lang === 'ar' ? 'لماذا تختار سوليفا؟' : 'Why Choose Soleva?'}
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              {lang === 'ar' ?
                'نقدم لك أفضل تجربة تسوق مع ضمان الجودة والخدمة المتميزة' :
                'We provide the best shopping experience with quality assurance and exceptional service'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <GlassCard className="text-center h-full">
              <div className="text-6xl mb-6">🚚</div>
              <h3 className="text-xl font-semibold mb-4">
                {lang === 'ar' ? 'شحن مجاني' : 'Free Shipping'}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {lang === 'ar' ? 'شحن مجاني للطلبات فوق 500 جنيه' : 'Free shipping on orders over 500 EGP'}
              </p>
            </GlassCard>

            <GlassCard className="text-center h-full">
              <div className="text-6xl mb-6">🛡️</div>
              <h3 className="text-xl font-semibold mb-4">
                {lang === 'ar' ? 'دفع آمن' : 'Secure Payment'}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {lang === 'ar' ? 'دفع آمن 100%' : '100% secure payment processing'}
              </p>
            </GlassCard>

            <GlassCard className="text-center h-full">
              <div className="text-6xl mb-6">🎧</div>
              <h3 className="text-xl font-semibold mb-4">
                {lang === 'ar' ? 'دعم العملاء' : 'Customer Support'}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {lang === 'ar' ? 'دعم العملاء على مدار الساعة' : 'Round the clock customer support'}
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Simple Products Section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              {lang === 'ar' ? 'منتجات مميزة' : 'Featured Products'}
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              {lang === 'ar' ?
                'منتجات مختارة بعناية خصيصاً لك' :
                'Handpicked items just for you'
              }
            </p>
          </div>
          
          <div className="text-center py-16">
            <GlassCard className="max-w-md mx-auto">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold mb-2 text-text-primary">
                {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </h3>
              <p className="text-text-secondary">
                {lang === 'ar' ?
                  'جاري جلب المنتجات المميزة' :
                  'Fetching featured products'
                }
              </p>
            </GlassCard>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/products">
              <GlassButton variant="secondary" size="lg">
                {lang === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'}
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}