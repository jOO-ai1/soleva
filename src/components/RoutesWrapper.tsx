import * as React from 'react';

// Import React hooks
const { useEffect, Suspense, lazy } = React;
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { AnimatePresence } from 'framer-motion';

import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import ChatWidget from './ChatWidget';
import ProtectedRoute from './ProtectedRoute';

// Critical components loaded immediately
import Home from '../pages/Home';
import { ProductsPage } from '../pages/ProductsPage';
import ProductPage from '../pages/ProductPage';

// Lazy load non-critical components
const CollectionPage = lazy(() => import('../pages/CollectionPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const OrderConfirmation = lazy(() => import('../pages/OrderConfirmation'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const AccountPage = lazy(() => import('../pages/AccountPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderTrackingPage = lazy(() => import('../pages/OrderTrackingPage'));
const OrderDetailsPage = lazy(() => import('../pages/OrderDetailsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));

// Loading fallback component
const LoadingFallback = () =>
<div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>;


// Scroll to top component
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return null;
}

export default function RoutesWrapper() {
  const { lang } = useLang();
  const safeLang = ["ar", "en"].includes(lang) ? lang : "en";

  return (
    <div
      dir={safeLang === "ar" ? "rtl" : "ltr"}
      className={`${safeLang === "ar" ? "font-arabic" : "font-montserrat"} min-h-screen optimize-text`}
      lang={safeLang}>

      <Router>
        <ScrollToTop />
        <AppHeader />
        <main
          role="main"
          className="pt-20 sm:pt-24 lg:pt-28 min-h-[calc(100vh-60px)] bg-app"
          id="main-content">

          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/collections/:id" element={<CollectionPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route
                  path="/checkout"
                  element={
                  <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } />

                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                <Route path="/order-tracking" element={<OrderTrackingPage />} />
                <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
        <AppFooter />
        <ChatWidget />
      </Router>
    </div>);

}