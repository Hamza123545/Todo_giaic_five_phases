import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeaderGreetingProps {
  userName?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
}

export function HeaderGreeting({
  userName,
  title,
  subtitle,
  actions,
  loading = false,
}: HeaderGreetingProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {title || (
            <>
              {getGreeting()}
              {userName && <span className="ms-2">{userName}</span>}
            </>
          )}
        </h1>
        {subtitle && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

