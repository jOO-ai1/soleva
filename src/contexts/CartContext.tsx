import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../services/api';

interface CartItem {
  id: number;
  name: { ar: string; en: string };
  price: number;
  image: string;
  color: string;
  size: number;
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, color: string, size: number) => void;
  removeFromCart: (id: number, color: string, size: number) => void;
  updateQty: (id: number, color: string, size: number, qty: number) => void;
  clearCart: () => void;
  syncCartWithServer: () => Promise<void>;
  isGuestCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isGuestCart, setIsGuestCart] = useState(!isAuthenticated);
  
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sync cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user && isGuestCart) {
      syncCartWithServer();
    }
    setIsGuestCart(!isAuthenticated);
  }, [isAuthenticated, user, isGuestCart, syncCartWithServer]);
  
  const addToCart = (product: any, color: string, size: number) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id && item.color === color && item.size === size);
      if (exist) {
        return prev.map((item) =>
          (item.id === product.id && item.color === color && item.size === size)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, color, size, qty: 1 }];
    });
  };
  
  const removeFromCart = (id: number, color: string, size: number) =>
    setCart((prev) => prev.filter((item) => !(item.id === id && item.color === color && item.size === size)));
  
  const updateQty = (id: number, color: string, size: number, qty: number) =>
    setCart((prev) => prev.map((item) =>
      (item.id === id && item.color === color && item.size === size)
        ? { ...item, qty: Math.max(1, qty) }
        : item
    ));
  
  const clearCart = () => setCart([]);

  const syncCartWithServer = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Get server cart
      const serverResponse = await cartApi.getAll();
      const serverCart = serverResponse.data || [];
      
      // Merge guest cart with server cart
      const guestCart = cart;
      
      // Add guest cart items that don't exist on server
      guestCart.forEach(guestItem => {
        const existsOnServer = serverCart.some(serverItem => 
          serverItem.productId === guestItem.id.toString() && 
          serverItem.variant?.color === guestItem.color &&
          serverItem.variant?.size === guestItem.size
        );
        
        if (!existsOnServer) {
          // Add to server cart
          cartApi.add(guestItem.id.toString(), undefined, guestItem.qty);
        }
      });
      
      // Update local cart with server data
      const updatedCart = serverCart.map(serverItem => ({
        id: parseInt(serverItem.productId),
        name: serverItem.product.name,
        price: serverItem.product.price,
        image: serverItem.product.images?.[0] || '',
        color: serverItem.variant?.color || '',
        size: serverItem.variant?.size || 0,
        qty: serverItem.quantity
      }));
      
      setCart(updatedCart);
      setIsGuestCart(false);
    } catch (error) {
      console.error('Failed to sync cart with server:', error);
    }
  }, [isAuthenticated, user, cart]);
  
  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQty, 
      clearCart, 
      syncCartWithServer,
      isGuestCart 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}