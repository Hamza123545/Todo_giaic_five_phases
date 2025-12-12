/**
 * Performance monitoring utilities
 *
 * Provides utilities for measuring and reporting performance metrics
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: "navigation" | "resource" | "measure" | "custom";
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.initializeObservers();
    }
  }

  // Initialize performance observers
  private initializeObservers(): void {
    try {
      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: "page-load",
              duration: navEntry.loadEventEnd - navEntry.fetchStart,
              timestamp: Date.now(),
              type: "navigation",
            });
          }
        }
      });

      navigationObserver.observe({ type: "navigation", buffered: true });
      this.observers.push(navigationObserver);

      // Observe largest contentful paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric({
            name: "lcp",
            duration: lastEntry.startTime,
            timestamp: Date.now(),
            type: "measure",
          });
        }
      });

      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      this.observers.push(lcpObserver);

      // Observe first input delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric({
            name: "fid",
            duration: fidEntry.processingStart - fidEntry.startTime,
            timestamp: Date.now(),
            type: "measure",
          });
        }
      });

      fidObserver.observe({ type: "first-input", buffered: true });
      this.observers.push(fidObserver);

      // Observe cumulative layout shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (layoutEntry.hadRecentInput) continue;
          if (layoutEntry.value !== undefined) {
            clsValue += layoutEntry.value;
          }
        }
        this.recordMetric({
          name: "cls",
          duration: clsValue,
          timestamp: Date.now(),
          type: "measure",
        });
      });

      clsObserver.observe({ type: "layout-shift", buffered: true });
      this.observers.push(clsObserver);
    } catch (error) {
      console.error("Failed to initialize performance observers:", error);
    }
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.set(metric.name, metric);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${metric.name}:`, metric.duration.toFixed(2), "ms");
    }
  }

  // Start a custom performance measurement
  startMeasure(name: string): void {
    if (typeof window !== "undefined" && window.performance) {
      performance.mark(`${name}-start`);
    }
  }

  // End a custom performance measurement
  endMeasure(name: string): number | null {
    if (typeof window !== "undefined" && window.performance) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const measure = performance.getEntriesByName(name, "measure")[0];
        if (measure) {
          this.recordMetric({
            name,
            duration: measure.duration,
            timestamp: Date.now(),
            type: "custom",
          });

          // Clean up marks and measures
          performance.clearMarks(`${name}-start`);
          performance.clearMarks(`${name}-end`);
          performance.clearMeasures(name);

          return measure.duration;
        }
      } catch (error) {
        console.error(`Failed to measure ${name}:`, error);
      }
    }
    return null;
  }

  // Get a specific metric
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get core web vitals
  getCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    return {
      lcp: this.metrics.get("lcp")?.duration,
      fid: this.metrics.get("fid")?.duration,
      cls: this.metrics.get("cls")?.duration,
    };
  }

  // Report metrics (can be extended to send to analytics service)
  reportMetrics(): void {
    const metrics = this.getAllMetrics();
    const webVitals = this.getCoreWebVitals();

    if (process.env.NODE_ENV === "development") {
      console.group("Performance Metrics");
      console.table(metrics);
      console.log("Core Web Vitals:", webVitals);
      console.groupEnd();
    }

    // TODO: Send to analytics service
    // Example: sendToAnalytics(metrics, webVitals);
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function to measure async operations
export async function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  performanceMonitor.startMeasure(name);
  try {
    const result = await operation();
    return result;
  } finally {
    performanceMonitor.endMeasure(name);
  }
}

// Helper function to measure sync operations
export function measureSync<T>(name: string, operation: () => T): T {
  performanceMonitor.startMeasure(name);
  try {
    const result = operation();
    return result;
  } finally {
    performanceMonitor.endMeasure(name);
  }
}

// Web Vitals metric type
interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta?: number;
  rating?: "good" | "needs-improvement" | "poor";
}

// Report web vitals to console or analytics
export function reportWebVitals(metric: WebVitalsMetric): void {
  if (process.env.NODE_ENV === "development") {
    console.log(metric.name, metric.value);
  }

  // TODO: Send to analytics service
  // Example:
  // window.gtag?.('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_label: metric.id,
  //   non_interaction: true,
  // });
}
