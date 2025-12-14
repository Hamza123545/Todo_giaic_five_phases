"use client";

/**
 * UndoRedoControls Component
 *
 * UI controls for undo/redo functionality
 * Supports keyboard shortcuts: Ctrl+Z (undo) and Ctrl+Y (redo)
 * Shows toast notifications with undo option
 */

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { UndoRedoHook } from "@/hooks/useUndoRedo";

interface UndoRedoControlsProps {
  undoRedo: UndoRedoHook;
  className?: string;
}

export default function UndoRedoControls({ undoRedo, className }: UndoRedoControlsProps) {
  const { undo, redo, canUndo, canRedo } = undoRedo;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label="Undo and redo controls"
    >
      {/* Undo Button */}
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "text-sm font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "dark:focus:ring-offset-gray-900",
          canUndo
            ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        aria-label="Undo last action (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
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
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        <span className="hidden sm:inline">Undo</span>
      </button>

      {/* Redo Button */}
      <button
        onClick={() => redo()}
        disabled={!canRedo}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "text-sm font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "dark:focus:ring-offset-gray-900",
          canRedo
            ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        aria-label="Redo last undone action (Ctrl+Y)"
        title="Redo (Ctrl+Y)"
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
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
        <span className="hidden sm:inline">Redo</span>
      </button>
    </div>
  );
}
