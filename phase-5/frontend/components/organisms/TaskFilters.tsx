'use client';

import { TaskFilter, TaskPriority } from '@/types';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onSearchChange: (search: string) => void;
  totalCount: number;
  searchQuery?: string;
  onPriorityFilter?: (priorities: TaskPriority[]) => void;
  selectedPriorities?: TaskPriority[];
}

export function TaskFilters({
  currentFilter,
  onFilterChange,
  onSearchChange,
  totalCount,
  searchQuery = '',
  onPriorityFilter,
  selectedPriorities = [],
}: TaskFiltersProps) {
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const priorityButtonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchValue);
  };

  const handlePriorityToggle = (priority: TaskPriority) => {
    if (!onPriorityFilter) return;
    const newPriorities = selectedPriorities.includes(priority)
      ? selectedPriorities.filter((p) => p !== priority)
      : [...selectedPriorities, priority];
    onPriorityFilter(newPriorities);
  };

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showPriorityFilter && priorityButtonRef.current) {
      const updatePosition = () => {
        if (priorityButtonRef.current) {
          const rect = priorityButtonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            left: rect.left,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showPriorityFilter]);

  const filterButtons: { label: string; value: TaskFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <GlassCard variant="elevated" className="p-4 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search tasks..."
          className="w-full ps-10 pe-10 py-2 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              setSearchValue('');
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterButtons.map(({ label, value }) => (
          <Button
            key={value}
            variant={currentFilter === value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(value)}
          >
            {label}
          </Button>
        ))}

        {/* Priority Filter */}
        {onPriorityFilter && (
          <div className="relative" ref={priorityButtonRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityFilter(!showPriorityFilter);
              }}
            >
              <Filter className="w-4 h-4 me-1" />
              Priority
            </Button>
            {showPriorityFilter && typeof window !== 'undefined' && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowPriorityFilter(false)}
                />
                <div 
                  className="fixed z-[10000] glass-card-elevated p-2 min-w-[150px] rounded-lg shadow-2xl border border-white/20 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
                  style={{ 
                    top: `${dropdownPosition.top}px`, 
                    left: `${dropdownPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                  <label
                    key={priority}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 dark:hover:bg-gray-800/50 cursor-pointer text-gray-900 dark:text-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(priority)}
                      onChange={() => {
                        handlePriorityToggle(priority);
                      }}
                      className="rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm capitalize">{priority}</span>
                  </label>
                ))}
                </div>
              </>,
              document.body
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalCount} {totalCount === 1 ? 'task' : 'tasks'} found
      </div>
    </GlassCard>
  );
}

