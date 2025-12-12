"use client";

/**
 * Toast Component (Simple Sonner-style)
 *
 * A lightweight toast notification system with animations.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title?: string;
  description: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

// Global toast instance (will be set by ToastProvider)
let toastInstance: ((toast: Omit<Toast, "id">) => void) | null = null;

// Function to set the toast instance (called by ToastProvider)
function setToastInstance(instance: ((toast: Omit<Toast, "id">) => void) | null) {
  toastInstance = instance;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const duration = toast.duration || 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  React.useEffect(() => {
    setToastInstance(toast);
    return () => {
      setToastInstance(null);
    };
  }, [toast]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="mb-2"
          >
            <ToastItem toast={toast} dismiss={dismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const styles = {
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg",
        styles[toast.type]
      )}
      role="alert"
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 space-y-1">
        {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
        <div className="text-sm opacity-90">{toast.description}</div>
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Export toast function that uses the global instance
export function toast(toastData: Omit<Toast, "id">) {
  if (!toastInstance) {
    console.warn(
      "Toast called before ToastProvider is mounted. Make sure ToastProvider wraps your app."
    );
    return;
  }
  toastInstance(toastData);
}
