"use client";

/**
 * UndoToast Component
 *
 * Toast notification with undo option for reversible actions
 * Shows for 5 seconds with auto-dismiss
 * Supports dark mode styling
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Command } from "@/hooks/useUndoRedo";

interface UndoToastProps {
  command: Command | null;
  onUndo: () => void;
  onDismiss: () => void;
  className?: string;
}

export default function UndoToast({ command, onUndo, onDismiss, className }: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(() => !!command);

  useEffect(() => {
    if (command) {
      // Use setTimeout to avoid setState in effect
      const showTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 0);

      // Auto-dismiss after 5 seconds
      const dismissTimeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation
      }, 5000);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(dismissTimeout);
      };
    } else {
      // Use setTimeout to avoid setState in effect
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 0);
      return () => clearTimeout(hideTimeout);
    }
  }, [command, onDismiss]);

  if (!command) {
    return null;
  }

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(() => {
      onUndo();
      onDismiss();
    }, 300); // Wait for animation
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
          "bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100",
          "border border-gray-700 dark:border-gray-600",
          "min-w-[300px] max-w-[400px]"
        )}
      >
        {/* Success Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-green-500"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>

        {/* Message */}
        <p className="flex-1 text-sm font-medium">{command.description}</p>

        {/* Undo Button */}
        <button
          onClick={handleUndo}
          className={cn(
            "px-3 py-1 rounded text-sm font-medium",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "focus:ring-offset-gray-900",
            "transition-colors duration-200"
          )}
          aria-label="Undo action"
        >
          Undo
        </button>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className={cn(
            "shrink-0 p-1 rounded",
            "text-gray-400 hover:text-white",
            "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
            "focus:ring-offset-gray-900",
            "transition-colors duration-200"
          )}
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
