"use client";

import { useEffect } from "react";
import { performanceMonitor, measureAsync } from "@/lib/performance";

export function usePerformance(componentName: string) {
  useEffect(() => {
    // Record component mount time
    performanceMonitor.startMeasure(`${componentName}-mount`);

    return () => {
      // Record component unmount time
      performanceMonitor.endMeasure(`${componentName}-mount`);
    };
  }, [componentName]);

  // Helper to measure async operations within the component
  const measure = async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    return measureAsync(`${componentName}-${operationName}`, operation);
  };

  return { measure };
}
