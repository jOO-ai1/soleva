import React, { createContext, useContext, useEffect, useState } from 'react';

interface FavoritesContextType {
  favorites: number[];
  addToFavorites: (productId: number) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);
  
  const addToFavorites = (productId: number) => {
    setFavorites(prev => prev.includes(productId) ? prev : [...prev, productId]);
  };
  
  const removeFromFavorites = (productId: number) => {
    setFavorites(prev => prev.filter(id => id !== productId));
  };
  
  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };
  
  const toggleFavorite = (productId: number) => {
    if (isFavorite(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };
  
  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addToFavorites, 
      removeFromFavorites, 
      isFavorite, 
      toggleFavorite 
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}