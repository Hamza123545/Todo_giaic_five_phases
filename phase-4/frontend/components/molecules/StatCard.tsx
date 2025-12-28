import { type LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { GlassCard } from '@/components/atoms/GlassCard';
import { cn } from '@/lib/utils';

export interface TrendData {
  value: number; // percentage change
  direction: 'up' | 'down' | 'neutral';
  label?: string;
  period?: string;
}

export interface ChartData {
  values: number[];
  labels?: string[];
}

export interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: TrendData;
  chart?: ChartData;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor = 'text-indigo-600 dark:text-indigo-400',
  trend,
  chart,
  loading = false,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </GlassCard>
    );
  }

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <GlassCard variant="elevated" hover={!!onClick} onClick={onClick} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {prefix}
              {formatValue(value)}
              {suffix}
            </span>
            {trend && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {Math.abs(trend.value).toFixed(1)}%
                  {trend.period && ` ${trend.period}`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={cn('p-3 rounded-xl bg-indigo-500/10', iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {chart && chart.values.length > 0 && (
        <div className="mt-4 h-16 flex items-end gap-1">
          {chart.values.map((val, idx) => {
            const maxVal = Math.max(...chart.values);
            const height = (val / maxVal) * 100;
            return (
              <div
                key={idx}
                className="flex-1 bg-indigo-500/30 rounded-t transition-all duration-300 hover:bg-indigo-500/50"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

