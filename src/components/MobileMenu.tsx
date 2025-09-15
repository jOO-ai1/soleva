import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMenu, FiShoppingCart, FiUser, FiHeart } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTranslation } from '../contexts/LangContext';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { cart } = useCart();
  const { favorites } = useFavorites();
  const t = useTranslation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const menuItems = [
    { path: '/', label: t('home'), icon: null },
    { path: '/products', label: t('collections'), icon: null },
    { path: '/favorites', label: t('favorites'), icon: FiHeart, badge: favorites.length },
    { path: '/cart', label: t('cart'), icon: FiShoppingCart, badge: cart.length },
    { path: '/about', label: t('aboutUs'), icon: null },
    { path: '/contact', label: t('contactUs'), icon: null },
    { path: user ? '/account' : '/login', label: user ? t('account') : t('login'), icon: FiUser }
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden btn btn-ghost p-3 interactive-hover min-h-[44px] min-w-[44px]"
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 md:hidden"
            onClick={closeMenu}
          >
            {/* Backdrop with Professional Blur */}
            <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-[25px] backdrop-saturate-[200%] backdrop-brightness-95" />
            
            {/* Menu Container */}
            <div className="flex items-center justify-center min-h-screen p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Menu Card */}
                <div className="modern-glass-card rounded-2xl p-6 shadow-2xl border border-border-primary backdrop-blur-[50px] backdrop-saturate-[250%] backdrop-brightness-105">
                  {/* Close Button */}
                  <button
                    onClick={closeMenu}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <FiX size={20} className="text-text-primary" />
                  </button>

                  {/* Menu Items */}
                  <nav className="mt-8 space-y-3">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-primary hover:text-black dark:hover:bg-primary dark:hover:text-black transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            {Icon && <Icon size={20} />}
                            <span className="font-semibold text-lg">{item.label}</span>
                          </div>
                          {item.badge && item.badge > 0 && (
                            <span className="bg-red-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}