'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'p-2 rounded-lg bg-white/10 dark:bg-gray-800/10 border border-white/30 dark:border-gray-700/50 backdrop-blur-xl',
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'p-2 rounded-lg glass-card transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        sizeStyles[size],
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className={cn('text-yellow-500', iconSizes[size])} />
      ) : (
        <Moon className={cn('text-indigo-600', iconSizes[size])} />
      )}
      {showLabel && (
        <span className="ms-2 text-sm font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

