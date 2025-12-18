export interface StatValue {
  value: number;
  change: number; // percentage change (positive or negative)
}

export interface DashboardStats {
  activeTasks: StatValue;
  completedTasks: StatValue;
  avgPriorityScore: StatValue;
}

// Example data:
export const mockDashboardStats: DashboardStats = {
  activeTasks: {
    value: 24780,
    change: 14.89,
  },
  completedTasks: {
    value: 17489,
    change: -2.45,
  },
  avgPriorityScore: {
    value: 9962,
    change: 0.92,
  },
};

