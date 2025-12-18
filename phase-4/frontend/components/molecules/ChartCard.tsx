import { GlassCard } from '@/components/atoms/GlassCard';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  error,
  className,
}: ChartCardProps) {
  return (
    <GlassCard variant="elevated" className={cn('p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading && (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
        </div>
      )}

      {error && (
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500 dark:text-red-400">{error}</div>
        </div>
      )}

      {!loading && !error && <div className="w-full">{children}</div>}
    </GlassCard>
  );
}

