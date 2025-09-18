import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthSafe } from './AuthContext';
import { favoritesApi } from '../services/api';

interface FavoritesContextType {
  favorites: number[];
  addToFavorites: (productId: number) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  syncFavoritesWithServer: () => Promise<void>;
  isGuestFavorites: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthSafe();
  const isAuthenticated = auth?.isAuthenticated || false;
  const user = auth?.user;
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [isGuestFavorites, setIsGuestFavorites] = useState(!isAuthenticated);
  
  // Define before effects to avoid "used before declaration" error
  const syncFavoritesWithServer = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Get server favorites
      const serverResponse = await favoritesApi.getAll();
      const serverFavorites: any[] = (serverResponse.data as any[]) || [];
      
      // Merge guest favorites with server favorites
      const guestFavorites = favorites;
      
      // Add guest favorites that don't exist on server
      const newFavorites = guestFavorites.filter(guestId => 
        !serverFavorites.some((serverFav: any) => serverFav.productId === guestId)
      );
      
      // Add new favorites to server
      for (const productId of newFavorites) {
        try {
          await favoritesApi.add(productId);
        } catch (error) {
          console.error(`Failed to add favorite ${productId} to server:`, error);
        }
      }
      
      // Update local favorites with server data
      const updatedFavorites: number[] = serverFavorites.map((fav: any) => fav.productId);
      setFavorites(updatedFavorites);
      setIsGuestFavorites(false);
    } catch (error) {
      console.error('Failed to sync favorites with server:', error);
    }
  }, [isAuthenticated, user, favorites]);
  
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync favorites when user logs in
  useEffect(() => {
    if (isAuthenticated && user && isGuestFavorites) {
      syncFavoritesWithServer();
    }
    setIsGuestFavorites(!isAuthenticated);
  }, [isAuthenticated, user, isGuestFavorites, syncFavoritesWithServer]);
  
  const addToFavorites = async (productId: number) => {
    setFavorites(prev => prev.includes(productId) ? prev : [...prev, productId]);
    
    // If authenticated, also add to server
    if (isAuthenticated) {
      try {
        await favoritesApi.add(productId);
      } catch (error) {
        console.error('Failed to add favorite to server:', error);
        // Revert local change if server fails
        setFavorites(prev => prev.filter(id => id !== productId));
      }
    }
  };
  
  const removeFromFavorites = async (productId: number) => {
    setFavorites(prev => prev.filter(id => id !== productId));
    
    // If authenticated, also remove from server
    if (isAuthenticated) {
      try {
        await favoritesApi.remove(productId);
      } catch (error) {
        console.error('Failed to remove favorite from server:', error);
        // Revert local change if server fails
        setFavorites(prev => [...prev, productId]);
      }
    }
  };
  
  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };
  
  const toggleFavorite = async (productId: number) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  };

  
  
  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addToFavorites, 
      removeFromFavorites, 
      isFavorite, 
      toggleFavorite,
      syncFavoritesWithServer,
      isGuestFavorites
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