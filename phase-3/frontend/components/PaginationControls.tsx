"use client";

/**
 * PaginationControls Component
 *
 * Page navigation component with Previous/Next buttons and page numbers
 * Includes items per page selector and total count display
 */

import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  className,
}: PaginationControlsProps) {
  // Calculate displayed item range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display (max 7 page buttons)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
      role="navigation"
      aria-label="Pagination navigation"
    >
      {/* Items Info and Per Page Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Items Per Page Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="items-per-page"
            className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
          >
            Items per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className={cn(
              "px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
              "rounded-md shadow-sm text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "text-gray-700 dark:text-gray-300"
            )}
            aria-label="Select number of items per page"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Items Range Display */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startItem}</span> -{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> items
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium",
              "border border-gray-300 dark:border-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
              "transition-colors"
            )}
            aria-label="Go to previous page"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium min-w-10",
                    "border border-gray-300 dark:border-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "transition-colors",
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                >
                  {page}
                </span>
              )
            )}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium",
              "border border-gray-300 dark:border-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
              "transition-colors"
            )}
            aria-label="Go to next page"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
}
