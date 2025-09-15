import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ApiError } from '../services/api';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T, P = any>(
  apiCall: (params: P) => Promise<ApiResponse<T>>
) {
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
  return useApi(() => import('../services/api').then(({ productsApi }) => productsApi.getAll(params)), [params]);
}

export function useProduct(id: number) {
  return useApi(() => import('../services/api').then(({ productsApi }) => productsApi.getById(id)), [id]);
}

export function useCollections() {
  return useApi(() => import('../services/api').then(({ collectionsApi }) => collectionsApi.getAll()), []);
}

export function useCollection(id: string) {
  return useApi(() => import('../services/api').then(({ collectionsApi }) => collectionsApi.getById(id)), [id]);
}

export function useFavoritesData() {
  return useApi(() => import('../services/api').then(({ favoritesApi }) => favoritesApi.getAll()), []);
}

export function useOrders() {
  return useApi(() => import('../services/api').then(({ ordersApi }) => ordersApi.getAll()), []);
}

export function useCart() {
  return useApi(() => import('../services/api').then(({ cartApi }) => cartApi.get()), []);
}