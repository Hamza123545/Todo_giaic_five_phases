'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation';
import { BRAND_CONFIG } from '@/lib/brand';
import { useLayoutState } from '@/hooks/useLayoutState';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { authClient, signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export interface SidebarProps {
  items?: typeof NAV_ITEMS;
  isCollapsed?: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
  activeItem?: string;
  userName?: string;
  userAvatar?: string;
}

export function Sidebar({
  items = NAV_ITEMS,
  isCollapsed: externalCollapsed,
  onCollapseToggle,
  activeItem: externalActiveItem,
  userName: externalUserName,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, actions } = useLayoutState();
  const [userName, setUserName] = useState<string | undefined>(externalUserName);

  const isCollapsed = externalCollapsed ?? state.sidebarCollapsed;
  const activeItem = externalActiveItem ?? pathname;

  // Fetch user name if not provided
  useEffect(() => {
    if (!externalUserName) {
      authClient.getSession().then((session) => {
        if (session?.data?.user?.name) {
          setUserName(session.data.user.name);
        } else if (session?.data?.user?.email) {
          setUserName(session.data.user.email.split('@')[0]);
        }
      });
    }
  }, [externalUserName]);

  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onCollapseToggle) {
      onCollapseToggle(newCollapsed);
    } else {
      actions.collapseSidebar(newCollapsed);
    }
  };

  const Logo = BRAND_CONFIG.logo;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-30 transition-all duration-300 flex flex-col glass-card-elevated overflow-hidden',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {BRAND_CONFIG.shortName}
            </span>
          </div>
        )}
        {isCollapsed && (
          <Logo className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mx-auto" />
        )}
        <button
          onClick={handleCollapseToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.href || activeItem.startsWith(item.href + '/');

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 hover:scale-105',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-600/20 text-indigo-700 dark:text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20 dark:border-gray-700/50 space-y-2 mt-auto">
        {!isCollapsed && userName && (
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
            {userName}
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          {!isCollapsed && <span className="text-xs text-gray-500 dark:text-gray-500">Theme</span>}
          <ThemeToggle size="sm" />
        </div>
        <button
          onClick={async () => {
            try {
              await signOut();
              router.push('/');
            } catch (error) {
              console.error('Sign out failed:', error);
            }
          }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-red-600 dark:text-red-400 hover:bg-red-500/10',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

