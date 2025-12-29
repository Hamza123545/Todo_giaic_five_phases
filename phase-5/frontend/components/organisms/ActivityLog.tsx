'use client';

import { GlassCard } from '@/components/atoms/GlassCard';
import { CheckCircle, Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'created' | 'completed' | 'updated' | 'deleted' | 'commented';
  description: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

export interface ActivityLogProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
}

const activityIcons = {
  created: Plus,
  completed: CheckCircle,
  updated: Edit,
  deleted: Trash2,
  commented: MessageCircle,
};

const activityColors = {
  created: 'text-blue-500',
  completed: 'text-green-500',
  updated: 'text-yellow-500',
  deleted: 'text-red-500',
  commented: 'text-indigo-500',
};

export function ActivityLog({
  activities,
  loading = false,
  maxItems = 10,
  onLoadMore,
}: ActivityLogProps) {
  const displayedActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (activities.length === 0) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No recent activity
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated" className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {displayedActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const color = activityColors[activity.type];
          const timestamp =
            activity.timestamp instanceof Date
              ? activity.timestamp
              : new Date(activity.timestamp);

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className={cn('p-2 rounded-lg bg-white/10', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {activity.description}
                </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(timestamp).toLocaleDateString()}
                  </p>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="mt-4 w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Load more...
        </button>
      )}
    </GlassCard>
  );
}

