"use client";

/**
 * ToastNotification Component
 *
 * Success/error toast messages
 * Auto-dismiss after timeout
 * Manual dismiss option
 * Stack multiple notifications
 */

import { useEffect, useState, ReactElement } from "react";
import { ToastMessage, ToastType } from "@/types";

interface ToastNotificationProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ message, onDismiss }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const duration = message.duration || 5000;

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [message]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(message.id);
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const iconMap: Record<ToastType, ReactElement> = {
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const colorMap: Record<ToastType, string> = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <div
      className={`
        ${colorMap[message.type]}
        px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md
        transition-all duration-300 ease-in-out
        ${isLeaving ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">{iconMap[message.type]}</div>
      <div className="flex-1 text-sm font-medium">{message.message}</div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} message={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    dismissToast,
    success: (message: string, duration?: number) => showToast("success", message, duration),
    error: (message: string, duration?: number) => showToast("error", message, duration),
    warning: (message: string, duration?: number) => showToast("warning", message, duration),
    info: (message: string, duration?: number) => showToast("info", message, duration),
  };
}

export default ToastItem;
