import { useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface AbandonedCartConfig {
  timeoutMinutes: number;
  maxReminders: number;
  reminderIntervals: number[]; // Minutes after abandonment
}

const DEFAULT_CONFIG: AbandonedCartConfig = {
  timeoutMinutes: 30,
  maxReminders: 3,
  reminderIntervals: [60, 1440, 4320] // 1 hour, 1 day, 3 days
};

export const useAbandonedCart = (config: AbandonedCartConfig = DEFAULT_CONFIG) => {
  const { cart } = useCart();
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const abandonmentTrackedRef = useRef<boolean>(false);

  // Track cart activity
  useEffect(() => {
    if (cart.length > 0) {
      lastActivityRef.current = new Date();
      abandonmentTrackedRef.current = false;
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for abandonment tracking
      timeoutRef.current = setTimeout(() => {
        trackAbandonedCart();
      }, config.timeoutMinutes * 60 * 1000);
    } else {
      // Clear timeout if cart is empty
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abandonmentTrackedRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cart, config.timeoutMinutes]);

  // Track page visibility to pause/resume abandonment timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause the timer
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else {
        // Page is visible, restart timer if cart has items
        if (cart.length > 0 && !abandonmentTrackedRef.current) {
          const timeSinceLastActivity = Date.now() - lastActivityRef.current.getTime();
          const remainingTime = (config.timeoutMinutes * 60 * 1000) - timeSinceLastActivity;
          
          if (remainingTime > 0) {
            timeoutRef.current = setTimeout(() => {
              trackAbandonedCart();
            }, remainingTime);
          } else {
            trackAbandonedCart();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cart, config.timeoutMinutes]);

  // Track user interactions to reset abandonment timer
  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = new Date();
      
      if (cart.length > 0 && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          trackAbandonedCart();
        }, config.timeoutMinutes * 60 * 1000);
      }
    };

    // Track various user interactions
    const events = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [cart, config.timeoutMinutes]);

  const trackAbandonedCart = async () => {
    if (abandonmentTrackedRef.current || cart.length === 0) {
      return;
    }

    abandonmentTrackedRef.current = true;

    try {
      // Calculate cart value
      const cartValue = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Prepare cart data
      const cartData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalValue: cartValue,
        totalItems: cart.reduce((total, item) => total + item.quantity, 0),
        currency: 'EGP',
        abandonedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: getSessionId(),
        userId: user?.id,
        userEmail: user?.email
      };

      // Track abandonment event
      await fetch('/api/v1/analytics/abandoned-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify(cartData)
      });

      // Schedule email reminders if user is logged in
      if (user?.email) {
        await scheduleAbandonedCartReminders(cartData);
      }

      // Track analytics event
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'abandon_cart', {
          currency: 'EGP',
          value: cartValue,
          items: cartData.items
        });
      }

      if (typeof window.fbq !== 'undefined') {
        window.fbq('track', 'AddToCart', {
          value: cartValue,
          currency: 'EGP',
          content_ids: cartData.items.map(item => item.id),
          content_type: 'product'
        });
      }

    } catch (error) {
      console.error('Failed to track abandoned cart:', error);
    }
  };

  const scheduleAbandonedCartReminders = async (cartData: any) => {
    try {
      await fetch('/api/v1/email/abandoned-cart-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...cartData,
          reminderIntervals: config.reminderIntervals,
          maxReminders: config.maxReminders
        })
      });
    } catch (error) {
      console.error('Failed to schedule abandoned cart reminders:', error);
    }
  };

  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('session_id');
    
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('session_id', sessionId);
    }
    
    return sessionId;
  };

  const recoverCart = async (recoveryToken: string) => {
    try {
      const response = await fetch(`/api/v1/cart/recover/${recoveryToken}`, {
        headers: user ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        
        // Track recovery event
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'recover_cart', {
            currency: 'EGP',
            value: data.data.totalValue
          });
        }

        return data.data;
      }
    } catch (error) {
      console.error('Failed to recover cart:', error);
    }
    
    return null;
  };

  const getAbandonedCartStats = async () => {
    if (!user) return null;

    try {
      const response = await fetch('/api/v1/analytics/abandoned-cart/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to get abandoned cart stats:', error);
    }

    return null;
  };

  const createRecoveryLink = (cartData: any): string => {
    const recoveryToken = btoa(JSON.stringify({
      sessionId: cartData.sessionId,
      timestamp: cartData.abandonedAt,
      items: cartData.items.map((item: any) => ({ id: item.id, quantity: item.quantity }))
    }));

    return `${window.location.origin}/cart/recover/${recoveryToken}`;
  };

  const sendImmediateReminder = async () => {
    if (!user?.email || cart.length === 0) return;

    try {
      const cartValue = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      await fetch('/api/v1/email/immediate-cart-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: cart,
          totalValue: cartValue,
          recoveryLink: createRecoveryLink({
            sessionId: getSessionId(),
            abandonedAt: new Date().toISOString(),
            items: cart
          })
        })
      });
    } catch (error) {
      console.error('Failed to send immediate reminder:', error);
    }
  };

  return {
    trackAbandonedCart,
    recoverCart,
    getAbandonedCartStats,
    sendImmediateReminder,
    isAbandoned: abandonmentTrackedRef.current,
    lastActivity: lastActivityRef.current
  };
};
