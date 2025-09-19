import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ApiError, productsApi, categoriesApi, collectionsApi, favoritesApi, ordersApi, cartApi } from '../services/api';

// Generic hook for API calls with enhanced error handling
export function useApi<T>(
apiCall: () => Promise<ApiResponse<T>>,
dependencies: any[] = [],
options: {
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ApiError) => void;
} = {})
{
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError
  } = options;

  const fetchData = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        setRetryCount(0);
      }

      const response = await apiCall();
      setData(response.data);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const apiError = err as ApiError;
      
      // Provide user-friendly error messages
      const friendlyError = {
        ...apiError,
        message: apiError.message || 'An error occurred while fetching data'
      };
      
      setError(friendlyError);

      // Call error callback if provided
      if (onError) {
        onError(friendlyError);
      }

      // Retry logic for network errors and server errors only
      if (retryOnError && retryCount < maxRetries && (
        apiError.status === 0 || // Network error
        apiError.status >= 500 // Server error
      )) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [...dependencies, retryOnError, maxRetries, retryDelay, onError, retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
    isRetrying: retryCount > 0,
    retryCount
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T, P = any>(
apiCall: (params: P) => Promise<ApiResponse<T>>)
{
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(params);
      setData(response.data);
      return response;
    } catch (err) {
      const error = err as ApiError;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}

// Specific hooks for common operations
export function useProducts(params?: any) {
  return useApi(() => productsApi.getAll(params), [params]);
}

export function useProduct(id: number) {
  return useApi(() => productsApi.getById(id), [id]);
}

export function useCollections() {
  return useApi(() => collectionsApi.getAll(), []);
}

export function useCollection(id: string) {
  return useApi(() => collectionsApi.getById(id), [id]);
}

export function useFavoritesData() {
  return useApi(() => favoritesApi.getAll(), []);
}

export function useOrders() {
  return useApi(() => ordersApi.getAll(), []);
}

export function useCategories() {
  return useApi(() => categoriesApi.getAll(), []);
}

export function useCart() {
  return useApi(() => cartApi.get(), []);
}