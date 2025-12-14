"use client";

/**
 * SearchBar Component
 *
 * Search input with real-time search capability
 * Searches by title and description with debouncing
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
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

  // Create debounced search function using useMemo to ensure it's stable
  const debouncedSearch = useMemo(
    () => debounce(onSearch, debounceDelay),
    [onSearch, debounceDelay]
  );

  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  // Handle clear button
  const handleClear = () => {
    setSearchValue("");
    if (
      debouncedSearch &&
      "cancel" in debouncedSearch &&
      typeof debouncedSearch.cancel === "function"
    ) {
      debouncedSearch.cancel();
    }
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
        <Search className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="search"
        value={searchValue}
        onChange={handleChange}
        className={cn(
          "w-full pl-10 pr-10 py-2 border border-border",
          "rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "bg-background text-foreground",
          "placeholder:text-muted-foreground"
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
              "text-muted-foreground hover:text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary rounded",
              "transition-colors"
            )}
            aria-label="Clear search"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        ) : (
          <kbd
            className={cn(
              "hidden sm:inline-flex items-center gap-1 px-2 py-1",
              "text-xs font-semibold text-muted-foreground",
              "bg-muted border border-border",
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
