import React, { createContext, useContext, useEffect, useState } from 'react';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);
  
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
  
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
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