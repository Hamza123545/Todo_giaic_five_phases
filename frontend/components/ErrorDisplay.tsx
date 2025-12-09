'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
  title?: string;
}

export default function ErrorDisplay({
  message,
  onRetry,
  showRetry = true,
  title = 'Error'
}: ErrorDisplayProps) {
  return (
    <div
      className="rounded-md bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{message}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}