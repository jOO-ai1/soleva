import * as React from 'react';

// Import React hooks
const { createContext, useContext, useEffect, useState, useCallback } = React;
import { readJSON, safeSetItem } from '../utils/storage';
import { useAuthSafe } from './AuthContext';
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

interface Product {
  id: number;
  name: { ar: string; en: string };
  price: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: string, size: number) => void;
  removeFromCart: (id: number, color: string, size: number) => void;
  updateQty: (id: number, color: string, size: number, qty: number) => void;
  clearCart: () => void;
  syncCartWithServer: () => Promise<void>;
  isGuestCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthSafe();
  const isAuthenticated = auth?.isAuthenticated || false;
  const user = auth?.user;
  const [cart, setCart] = useState<CartItem[]>(() => readJSON<CartItem[]>("cart", []));
  const [isGuestCart, setIsGuestCart] = useState(!isAuthenticated);

  const syncCartWithServer = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      // Fetch current server cart
      const serverResponse = await cartApi.get();
      const serverCart: any[] = (serverResponse.data as any[]) || [];

      // Merge guest cart with server cart
      const guestCart = cart;
      guestCart.forEach((guestItem: CartItem) => {
        const existsOnServer = serverCart.some((serverItem: any) =>
          (serverItem.productId === String(guestItem.id)) &&
          (serverItem.variant?.color === guestItem.color) &&
          (serverItem.variant?.size === guestItem.size)
        );

        if (!existsOnServer) {
          // Best-effort add to server cart
          cartApi.add(guestItem.id, guestItem.color, guestItem.size, guestItem.qty).catch(() => {});
        }
      });

      const updatedCart: CartItem[] = serverCart.map((serverItem: any) => ({
        id: parseInt(serverItem.productId, 10),
        name: serverItem.product?.name ?? { ar: '', en: '' },
        price: serverItem.product?.price ?? 0,
        image: serverItem.product?.images?.[0] || '',
        color: serverItem.variant?.color || '',
        size: serverItem.variant?.size || 0,
        qty: serverItem.quantity ?? 1,
      }));

      setCart(updatedCart);
      setIsGuestCart(false);
    } catch (error) {
      console.error('Failed to sync cart with server:', error);
    }
  }, [isAuthenticated, user, cart]);

  useEffect(() => {
    safeSetItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sync cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user && isGuestCart) {
      syncCartWithServer();
    }
    setIsGuestCart(!isAuthenticated);
  }, [isAuthenticated, user, isGuestCart, syncCartWithServer]);
  
  const addToCart = (product: Product, color: string, size: number) => {
    setCart((prev: CartItem[]) => {
      const exist = prev.find((item: CartItem) => item.id === product.id && item.color === color && item.size === size);
      if (exist) {
        return prev.map((item: CartItem) =>
          (item.id === product.id && item.color === color && item.size === size)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, color, size, qty: 1 }];
    });
  };
  
  const removeFromCart = (id: number, color: string, size: number) =>
    setCart((prev: CartItem[]) => prev.filter((item: CartItem) => !(item.id === id && item.color === color && item.size === size)));
  
  const updateQty = (id: number, color: string, size: number, qty: number) =>
    setCart((prev: CartItem[]) => prev.map((item: CartItem) =>
      (item.id === id && item.color === color && item.size === size)
        ? { ...item, qty: Math.max(1, qty) }
        : item
    ));
  
  const clearCart = () => setCart([]);

  
  
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