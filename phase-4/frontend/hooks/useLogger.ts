"use client";

import { useCallback, useEffect } from "react";
import { logger } from "@/lib/logger";
import { usePathname } from "next/navigation";

export function useLogger(componentName?: string) {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      logger.trackPageView(pathname, componentName);
    }
  }, [pathname, componentName]);

  const debug = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      logger.debug(componentName ? `[${componentName}] ${message}` : message, context);
    },
    [componentName]
  );

  const info = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      logger.info(componentName ? `[${componentName}] ${message}` : message, context);
    },
    [componentName]
  );

  const warn = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      logger.warn(componentName ? `[${componentName}] ${message}` : message, context);
    },
    [componentName]
  );

  const error = useCallback(
    (message: string, context?: Record<string, unknown>, err?: Error) => {
      logger.error(componentName ? `[${componentName}] ${message}` : message, context, err);
    },
    [componentName]
  );

  const trackAction = useCallback(
    (action: string, category?: string, label?: string, value?: number) => {
      logger.trackAction(action, category || componentName, label, value);
    },
    [componentName]
  );

  return {
    debug,
    info,
    warn,
    error,
    trackAction,
    getLogs: logger.getLogs.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
    downloadLogs: logger.downloadLogs.bind(logger),
  };
}
