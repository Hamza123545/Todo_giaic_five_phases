/**
 * Lazy-loaded component wrappers for code splitting
 *
 * These components are loaded dynamically to reduce initial bundle size
 * and improve performance, especially for rarely used features.
 */

import dynamic from "next/dynamic";
import LoadingSpinner from "./LoadingSpinner";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner />
  </div>
);

// Lazy load heavy components with suspense fallback
export const LazyTaskDetailModal = dynamic(() => import("./TaskDetailModal"), {
  loading: LoadingFallback,
  ssr: false, // Modal doesn't need SSR
});

export const LazyTaskStatistics = dynamic(() => import("./TaskStatistics"), {
  loading: LoadingFallback,
  ssr: false, // Statistics can be loaded on demand
});

export const LazyExportImportControls = dynamic(() => import("./ExportImportControls"), {
  loading: LoadingFallback,
  ssr: false, // Export/import features loaded on demand
});

export const LazyBulkActions = dynamic(() => import("./BulkActions"), {
  loading: LoadingFallback,
  ssr: false,
});

export const LazyKeyboardShortcuts = dynamic(() => import("./KeyboardShortcuts"), {
  loading: LoadingFallback,
  ssr: false,
});

export const LazyUndoRedoControls = dynamic(() => import("./UndoRedoControls"), {
  loading: LoadingFallback,
  ssr: false,
});

export const LazySortableTaskItem = dynamic(
  () => import("./SortableTaskItem").then((mod) => ({ default: mod.SortableTaskItem })),
  {
    loading: () => <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />,
    ssr: true, // Can be server-rendered
  }
);
