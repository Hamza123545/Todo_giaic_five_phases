/**
 * usePolling Hook
 *
 * Custom hook for polling data at regular intervals
 * Supports automatic start/stop, interval configuration, and error handling
 */

"use client";

import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions {
  interval?: number; // Polling interval in milliseconds (default: 30000 = 30 seconds)
  enabled?: boolean; // Whether polling is enabled (default: true)
  onError?: (error: Error) => void; // Error handler
}

export function usePolling(callback: () => Promise<void> | void, options: UsePollingOptions = {}) {
  const { interval = 30000, enabled = true, onError } = options;

  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = async () => {
      try {
        await savedCallback.current();
      } catch (error) {
        console.error("Polling error:", error);
        onError?.(error as Error);
      }
    };

    // Start polling
    intervalRef.current = setInterval(tick, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled, onError]);

  // Manual trigger function
  const trigger = useCallback(async () => {
    try {
      await savedCallback.current();
    } catch (error) {
      console.error("Manual trigger error:", error);
      onError?.(error as Error);
    }
  }, [onError]);

  return { trigger };
}
