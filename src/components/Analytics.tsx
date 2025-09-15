import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { useCart } from '../contexts/CartContext'; // Unused for now

// Google Analytics 4
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    gtm: any;
  }
}

interface AnalyticsProps {
  children: React.ReactNode;
}

const Analytics: React.FC<AnalyticsProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  // const { cart } = useCart(); // Unused for now

  // Initialize analytics on mount
  useEffect(() => {
    initializeGA4();
    initializeFacebookPixel();
    initializeGTM();
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  // Track user login/logout
  useEffect(() => {
    if (user) {
      trackLogin(user.id, 'email');
    }
  }, [user]);

  const initializeGA4 = () => {
    const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    
    if (!GA4_ID || GA4_ID === 'G-XXXXXXXXXX') {
      // GA4 not configured
      return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    if (window.gtag) {
      window.gtag('config', GA4_ID, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        // Enhanced ecommerce
        custom_map: {
          custom_parameter_1: 'user_type',
          custom_parameter_2: 'cart_value'
        }
      });
    }

    // Set user properties if logged in
    if (user) {
      window.gtag('config', GA4_ID, {
        user_id: user.id,
        custom_map: {
          user_type: user.role || 'customer'
        }
      });
    }
  };

  const initializeFacebookPixel = () => {
    const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
    
    if (!PIXEL_ID || PIXEL_ID === 'CHANGE_THIS_PIXEL_ID' || PIXEL_ID.trim() === '') {
      // Facebook Pixel not configured or temporarily disabled
      console.log('Facebook Pixel initialization skipped - PIXEL_ID not configured');
      return;
    }

    // Facebook Pixel Code
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if(f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if(!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');

    // Track user if logged in
    if (user) {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'User Login'
      });
    }
  };

  const initializeGTM = () => {
    const GTM_ID = import.meta.env.VITE_GTM_CONTAINER_ID;
    
    if (!GTM_ID || GTM_ID === 'GTM-XXXXXXX') {
      // GTM not configured
      return;
    }

    // Google Tag Manager
    (function(w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);
  };

  return <>{children}</>;
};

// Analytics tracking functions
export const trackPageView = (page: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: page
    });
  }

  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'PageView');
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: page,
      page_title: document.title
    });
  }
};

export const trackPurchase = (orderId: string, value: number, currency: string = 'EGP', items: any[]) => {
  // GA4 Enhanced Ecommerce
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: value,
      currency: currency,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_ids: items.map(item => item.id),
      content_type: 'product'
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: orderId,
        value: value,
        currency: currency,
        items: items
      }
    });
  }
};

export const trackAddToCart = (item: any) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'add_to_cart', {
      currency: 'EGP',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        quantity: 1,
        price: item.price
      }]
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'AddToCart', {
      value: item.price,
      currency: 'EGP',
      content_ids: [item.id],
      content_type: 'product'
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'EGP',
        value: item.price,
        items: [item]
      }
    });
  }
};

export const trackRemoveFromCart = (item: any) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'remove_from_cart', {
      currency: 'EGP',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        quantity: 1,
        price: item.price
      }]
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'remove_from_cart',
      ecommerce: {
        currency: 'EGP',
        value: item.price,
        items: [item]
      }
    });
  }
};

export const trackViewItem = (item: any) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'view_item', {
      currency: 'EGP',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price
      }]
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'ViewContent', {
      value: item.price,
      currency: 'EGP',
      content_ids: [item.id],
      content_type: 'product'
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'view_item',
      ecommerce: {
        currency: 'EGP',
        value: item.price,
        items: [item]
      }
    });
  }
};

export const trackBeginCheckout = (items: any[], value: number) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'begin_checkout', {
      currency: 'EGP',
      value: value,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'InitiateCheckout', {
      value: value,
      currency: 'EGP',
      content_ids: items.map(item => item.id),
      content_type: 'product',
      num_items: items.length
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'EGP',
        value: value,
        items: items
      }
    });
  }
};

export const trackSearch = (searchTerm: string) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'search', {
      search_term: searchTerm
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'search',
      search_term: searchTerm
    });
  }
};

export const trackLogin = (userId: string, method: string) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'login', {
      method: method
    });
    
    // Set user ID
    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
      user_id: userId
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'CompleteRegistration', {
      content_name: method
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'login',
      user_id: userId,
      method: method
    });
  }
};

export const trackSignUp = (userId: string, method: string) => {
  // GA4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'sign_up', {
      method: method
    });
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'CompleteRegistration', {
      content_name: method
    });
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'sign_up',
      user_id: userId,
      method: method
    });
  }
};

export default Analytics;
