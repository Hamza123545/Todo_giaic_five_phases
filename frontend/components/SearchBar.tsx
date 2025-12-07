"use client";

/**
 * SearchBar Component
 *
 * Search input with real-time search capability
 * Searches by title and description with debouncing
 */

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceDelay?: number;
  className?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search tasks by title or description...",
  debounceDelay = 300,
  className,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      onSearch(query);
    }, debounceDelay)
  ).current;

  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  // Handle clear button
  const handleClear = () => {
    setSearchValue("");
    onSearch("");
    inputRef.current?.focus();
  };

  // Keyboard shortcut (Ctrl+K or Cmd+K to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative", className)} role="search">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="search"
        value={searchValue}
        onChange={handleChange}
        className={cn(
          "w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600",
          "rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          "placeholder-gray-500 dark:placeholder-gray-400"
        )}
        placeholder={placeholder}
        aria-label="Search tasks"
        aria-describedby="search-description"
      />

      {/* Hidden description for screen readers */}
      <span id="search-description" className="sr-only">
        Search tasks by title or description. Press Ctrl+K to focus.
      </span>

      {/* Clear Button or Keyboard Shortcut Hint */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {searchValue ? (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
              "transition-colors"
            )}
            aria-label="Clear search"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : (
          <kbd
            className={cn(
              "hidden sm:inline-flex items-center gap-1 px-2 py-1",
              "text-xs font-semibold text-gray-500 dark:text-gray-400",
              "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
              "rounded"
            )}
            aria-label="Keyboard shortcut: Control plus K"
          >
            <span aria-hidden="true">⌘</span>
            <span>K</span>
          </kbd>
        )}
      </div>
    </div>
  );
}
