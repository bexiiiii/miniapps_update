'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Product, Store, PaginationResponse, safeArray, safePaginationResponse } from '@/lib/api';
import { withErrorBoundary, debounce } from '@/lib/utils';

// Hook for safe data fetching with error handling and caching
export const useSafeQuery = <T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  dependencies: any[] = [],
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
  }
) => {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const { enabled = true, refetchOnMount = false, cacheTime = 5 * 60 * 1000 } = options || {};

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const isCacheValid = now - lastFetch < cacheTime;

    if (!force && isCacheValid && !refetchOnMount) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await queryFn();
      setData(result);
      setLastFetch(now);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Query failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled, cacheTime, refetchOnMount, lastFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, isLoading, error, refetch };
};

// Hook for fetching stores with safe defaults
export const useStores = () => {
  return useSafeQuery(
    () => apiClient.getActiveStores(),
    [] as Store[],
    [],
    { cacheTime: 10 * 60 * 1000 } // Cache for 10 minutes
  );
};

// Hook for fetching products with pagination and safe defaults
export const useProducts = (page = 0, size = 20, storeId?: number) => {
  const queryFn = useCallback(async () => {
    if (storeId) {
      return apiClient.getProductsByStore(storeId, page, size);
    }
    return apiClient.getAllProducts(page, size);
  }, [page, size, storeId]);

  const defaultValue: PaginationResponse<Product> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: size,
    number: page,
    first: true,
    last: true
  };

  return useSafeQuery(
    queryFn,
    defaultValue,
    [page, size, storeId],
    { cacheTime: 2 * 60 * 1000 } // Cache for 2 minutes
  );
};

// Hook for fetching featured products
export const useFeaturedProducts = (page = 0, size = 20) => {
  const defaultValue: PaginationResponse<Product> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: size,
    number: page,
    first: true,
    last: true
  };

  return useSafeQuery(
    () => apiClient.getFeaturedProducts(page, size),
    defaultValue,
    [page, size],
    { cacheTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );
};

// Hook for fetching single store with error handling
export const useStore = (storeId: number | null) => {
  const queryFn = useCallback(async () => {
    if (!storeId) throw new Error('Store ID is required');
    return apiClient.getStoreById(storeId);
  }, [storeId]);

  return useSafeQuery(
    queryFn,
    null as Store | null,
    [storeId],
    { 
      enabled: !!storeId,
      cacheTime: 10 * 60 * 1000 // Cache for 10 minutes
    }
  );
};

// Hook for fetching single product with error handling
export const useProduct = (productId: number | null) => {
  const queryFn = useCallback(async () => {
    if (!productId) throw new Error('Product ID is required');
    return apiClient.getProductById(productId);
  }, [productId]);

  return useSafeQuery(
    queryFn,
    null as Product | null,
    [productId],
    { 
      enabled: !!productId,
      cacheTime: 5 * 60 * 1000 // Cache for 5 minutes
    }
  );
};

// Hook for managing orders with error handling
export const useOrders = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: orders, isLoading, error, refetch } = useSafeQuery(
    () => apiClient.getMyOrders(),
    [],
    [],
    { cacheTime: 30 * 1000 } // Cache for 30 seconds
  );

  const createReservation = useCallback(async (orderData: {
    productId: number;
    quantity: number;
    note?: string;
  }) => {
    if (isCreating) {
      throw new Error('Reservation creation already in progress');
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await apiClient.createReservation(orderData);
      refetch(); // Refresh orders list
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation';
      setCreateError(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, refetch]);

  return {
    orders: safeArray(orders),
    isLoading,
    error,
    refetch,
    createReservation,
    isCreating,
    createError,
    clearCreateError: () => setCreateError(null)
  };
};

// Debounced search hook
export const useSearch = <T>(
  searchFn: (query: string) => Promise<T>,
  defaultValue: T,
  debounceMs = 300
) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFunction = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setData(defaultValue);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await searchFn(searchQuery);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchFn, defaultValue]);

  const debouncedSearch = useCallback(
    debounce(searchFunction, debounceMs),
    [searchFunction, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    data,
    isLoading,
    error
  };
};