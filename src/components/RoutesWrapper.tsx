import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { AnimatePresence } from 'framer-motion';

import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import ChatWidget from './ChatWidget';

import Home from '../pages/Home';
import { ProductsPage } from '../pages/ProductsPage';
import ProductPage from '../pages/ProductPage';
import CollectionPage from '../pages/CollectionPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderConfirmation from '../pages/OrderConfirmation';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AccountPage from '../pages/AccountPage';
import OrdersPage from '../pages/OrdersPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import OrderDetailsPage from '../pages/OrderDetailsPage';
import NotFoundPage from '../pages/NotFoundPage';
import FavoritesPage from '../pages/FavoritesPage';
import ContactPage from '../pages/ContactPage';
import AboutPage from '../pages/AboutPage';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';
import ProtectedRoute from './ProtectedRoute';

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
      lang={safeLang}
    >
      <Router>
        <ScrollToTop />
        <AppHeader />
        <main 
          role="main" 
          className="pt-20 sm:pt-24 lg:pt-28 min-h-[calc(100vh-60px)] bg-app"
          id="main-content"
        >
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
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="/order-tracking" element={<OrderTrackingPage />} />
              <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatePresence>
        </main>
        <AppFooter />
        <ChatWidget />
      </Router>
    </div>
  );
}

