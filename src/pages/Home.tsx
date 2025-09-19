import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTruck, FiShield, FiHeadphones, FiArrowRight } from 'react-icons/fi';
import { useLang, useTranslation } from '../contexts/LangContext';
import { useProducts } from '../hooks/useApi';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import Logo from '../components/Logo';
import FavoriteButton from '../components/FavoriteButton';

export default function Home() {
  const { lang } = useLang();
  const t = useTranslation();

  // Fetch products from API with error handling
  const { data: productsResponse, loading: productsLoading, error: productsError } = useProducts();

  // Safely handle products data
  const products = Array.isArray(productsResponse) ? productsResponse : [];
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 6);

  // Show fallback content if API fails but don't crash
  const hasProductData = !productsLoading && products.length > 0;

  const features = [
  {
    icon: <FiTruck className="w-8 h-8" />,
    title: t("freeShipping"),
    description: lang === 'ar' ? "شحن مجاني للطلبات فوق 500 جنيه" : "Free shipping on orders over 500 EGP"
  },
  {
    icon: <FiShield className="w-8 h-8" />,
    title: t("securePayment"),
    description: lang === 'ar' ? "دفع آمن 100%" : "100% secure payment processing"
  },
  {
    icon: <FiHeadphones className="w-8 h-8" />,
    title: t("customerSupport"),
    description: lang === 'ar' ? "دعم العملاء على مدار الساعة" : "Round the clock customer support"
  }];


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-lg text-center">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8">

            <Logo size="large" className="justify-center mb-8" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6">

            {lang === 'ar' ? 'مرحباً بك في سوليفا' : 'Welcome to Soleva'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl mb-12 max-w-2xl mx-auto">

            {lang === 'ar' ?
            'اكتشف مجموعة أحذية فاخرة بتصميم عصري وجودة لا مثيل لها' :
            'Discover premium footwear with modern design and unmatched quality'
            }
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">

            <Link to="/products">
              <GlassButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto">

                <FiShoppingBag />
                {t("shopNow")}
              </GlassButton>
            </Link>
            <Link to="/about">
              <GlassButton
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto">

                {lang === 'ar' ? 'عن سوليفا' : 'About Soleva'}
                <FiArrowRight />
              </GlassButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">

            <h2 id="features-title" className="mb-4">
              {lang === 'ar' ? 'لماذا تختار سوليفا؟' : 'Why Choose Soleva?'}
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              {lang === 'ar' ?
              'نقدم لك أفضل تجربة تسوق مع ضمان الجودة والخدمة المتميزة' :
              'We provide the best shopping experience with quality assurance and exceptional service'
              }
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="feature-card">

                <GlassCard className="text-center h-full">
                  <div className="text-primary mb-6 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" aria-labelledby="featured-title">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">

            <h2 id="featured-title" className="mb-4">
              {t("featuredProducts")}
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              {lang === 'ar' ?
              'منتجات مختارة بعناية خصيصاً لك' :
              'Handpicked items just for you'
              }
            </p>
          </motion.div>
          
          {productsLoading ?
          <div className="text-center py-16">
              <GlassCard className="max-w-md mx-auto">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">
                  {lang === "ar" ? "جاري التحميل..." : "Loading..."}
                </h3>
                <p className="text-text-secondary">
                  {lang === "ar" ?
                "جاري جلب المنتجات المميزة" :
                "Fetching featured products"
                }
                </p>
              </GlassCard>
            </div> :
          productsError ?
          <div className="text-center py-16">
              <GlassCard className="max-w-md mx-auto">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">
                  {lang === "ar" ? "خطأ في التحميل" : "Loading Error"}
                </h3>
                <p className="text-text-secondary">
                  {lang === "ar" ?
                "حدث خطأ أثناء جلب المنتجات" :
                "An error occurred while fetching products"
                }
                </p>
              </GlassCard>
            </div> :
          featuredProducts.length === 0 ?
          <div className="text-center py-16">
              <GlassCard className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">
                  {lang === "ar" ? "لا توجد منتجات مميزة" : "No Featured Products"}
                </h3>
                <p className="text-text-secondary">
                  {lang === "ar" ?
                "لا توجد منتجات مميزة متاحة حالياً" :
                "No featured products available at the moment"
                }
                </p>
              </GlassCard>
            </div> :

          <div className="mobile-products-grid sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredProducts.map((product, index) =>
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="product-card group interactive-hover">

                  <Link to={`/product/${product.slug}`} className="block h-full">
                   <div className="product-card-image">
                      <img
                    src={Array.isArray(product.images) ? product.images[0] : product.images}
                    alt={product.name[lang] || product.name.en}
                    loading={index < 3 ? "eager" : "lazy"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" />

                      <FavoriteButton productId={product.id} />
                    </div>
                    
                   <div className="product-card-content">
                     <h3 className="product-card-title">
                        {product.name[lang] || product.name.en}
                      </h3>
                     <p className="product-card-description">
                        {product.description[lang] || product.description.en}
                      </p>
                     <div className="product-card-price">
                        {product.salePrice ?
                    <>
                            <span className="line-through text-text-secondary mr-2">
                              {Number(product.basePrice || product.price)} {t("egp")}
                            </span>
                            <span className="text-primary font-semibold">
                              {Number(product.salePrice)} {t("egp")}
                            </span>
                          </> :
                    <span>{Number(product.basePrice || product.price)} {t("egp")}</span>
                    }
                      </div>
                     <div className="product-card-actions">
                        <GlassButton
                      variant="primary"
                      className="w-full text-[#000000]">

                          {t("viewDetails")}
                        </GlassButton>
                      </div>
                    </div>
                  </Link>
                </motion.div>
            )}
            </div>
          }
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12">

            <Link to="/products">
              <GlassButton
                variant="secondary"
                size="lg">

                {lang === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'}
                <FiArrowRight />
              </GlassButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}>

            <GlassCard className="text-center max-w-4xl mx-auto">
              <h2 className="mb-6">
                {lang === 'ar' ?
                'مستعد لتجربة الجودة الفائقة؟' :
                'Ready to Experience Premium Quality?'
                }
              </h2>
              <p className="text-xl mb-8 leading-relaxed">
                {lang === 'ar' ?
                'انضم إلى آلاف العملاء الراضين الذين يثقون في سوليفا' :
                'Join thousands of satisfied customers who trust Soleva for their premium needs'
                }
              </p>
              <Link to="/products">
                <GlassButton
                  variant="primary"
                  size="lg">

                  <FiShoppingBag />
                  {t("shopNow")}
                </GlassButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </div>);

}