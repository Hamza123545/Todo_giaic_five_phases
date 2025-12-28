import {
  LayoutDashboard,
  List,
  MessageCircle,
  Calendar,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    icon: List,
  },
  {
    id: 'chat',
    label: 'AI Chatbot',
    href: '/chat',
    icon: MessageCircle,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

