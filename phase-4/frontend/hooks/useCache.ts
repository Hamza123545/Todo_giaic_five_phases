"use client";

import { useState, useEffect, useCallback } from "react";
import { apiCache, CacheOptions } from "@/lib/cache";

export function useCache<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsValidating(true);
      const result = await apiCache.fetch(key, fetcher, options);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(
    async (newData?: T, revalidate = true) => {
      if (newData !== undefined) {
        setData(newData);
        apiCache.set(key, newData, options?.ttl);
      }

      if (revalidate) {
        await fetchData();
      }
    },
    [key, options?.ttl, fetchData]
  );

  const invalidate = useCallback(() => {
    apiCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    invalidate,
  };
}
