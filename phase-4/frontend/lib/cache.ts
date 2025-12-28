/**
 * API response caching utilities
 *
 * Implements stale-while-revalidate caching strategy for API responses
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
  key?: string; // Custom cache key
}

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  // Generate cache key from URL and params
  private generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  // Check if cache entry is expired
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  // Check if cache entry is stale (but within grace period)
  private isStale(entry: CacheEntry<unknown>, staleTTL: number = 60000): boolean {
    const staleThreshold = entry.expiresAt - staleTTL;
    return Date.now() > staleThreshold;
  }

  // Get from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Remove expired entries
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Set cache entry
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    this.cache.set(key, entry);
  }

  // Delete from cache
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Fetch with cache (stale-while-revalidate strategy)
  async fetch<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const { ttl = this.defaultTTL, staleWhileRevalidate = true } = options;

    // Check cache first
    const cached = this.cache.get(key);

    // Return fresh cached data
    if (cached && !this.isExpired(cached)) {
      // If stale but not expired, revalidate in background
      if (staleWhileRevalidate && this.isStale(cached, 60000)) {
        this.revalidateInBackground(key, fetcher, ttl);
      }
      return cached.data as T;
    }

    // Check if there's a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Fetch fresh data
    const fetchPromise = fetcher()
      .then((data) => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        // If we have stale cached data, return it on error
        if (cached && staleWhileRevalidate) {
          console.warn("Fetch failed, returning stale cache:", error);
          return cached.data as T;
        }
        throw error;
      });

    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  // Revalidate in background (for stale-while-revalidate)
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    // Don't revalidate if already pending
    if (this.pendingRequests.has(key)) {
      return;
    }

    try {
      const data = await fetcher();
      this.set(key, data, ttl);
    } catch (error) {
      console.error("Background revalidation failed:", error);
      // Keep stale data on error
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    expired: number;
  } {
    const now = Date.now();
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt < now) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expired,
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

// Cache invalidation helpers
export const invalidateTaskCache = (userId?: string) => {
  if (userId) {
    apiCache.invalidatePattern(new RegExp(`/api/${userId}/tasks`));
  } else {
    apiCache.invalidatePattern(/\/api\/.*\/tasks/);
  }
};

export const invalidateUserCache = () => {
  apiCache.invalidatePattern(/\/api\/auth/);
};

// Periodic cleanup (run every 5 minutes)
if (typeof window !== "undefined") {
  setInterval(
    () => {
      apiCache.clearExpired();
    },
    5 * 60 * 1000
  );
}
