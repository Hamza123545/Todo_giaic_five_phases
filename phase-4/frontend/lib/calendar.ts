export type CalendarEventType = 'meeting' | 'deadline' | 'milestone';

export interface CalendarEvent {
  id: string;
  date: Date | string;
  title: string;
  type?: CalendarEventType;
  color?: string;
}

export interface CalendarDay {
  date: number; // Day of month (1-31)
  isToday: boolean;
  events: CalendarEvent[];
}

// Example data:
export const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', date: new Date(2025, 11, 5), title: 'Meeting', type: 'meeting' },
  { id: '2', date: new Date(2025, 11, 12), title: 'Meeting', type: 'meeting' },
  { id: '3', date: new Date(2025, 11, 19), title: 'Deadline', type: 'deadline' },
  { id: '4', date: new Date(2025, 11, 26), title: 'Meeting', type: 'meeting' },
];

