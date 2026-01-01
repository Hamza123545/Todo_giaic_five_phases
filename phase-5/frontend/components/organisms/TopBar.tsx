'use client';

import { Menu, X } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';
import { useLayoutState } from '@/hooks/useLayoutState';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient, signOut } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export interface TopBarProps {
  title?: string;
  showMenuToggle?: boolean;
  onMenuToggle?: () => void;
  showThemeToggle?: boolean;
  userName?: string;
  userAvatar?: string;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  showMenuToggle = true,
  onMenuToggle,
  showThemeToggle = true,
  userName: externalUserName,
  actions,
}: TopBarProps) {
  const { state, actions: layoutActions } = useLayoutState();
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | undefined>(externalUserName);

  const isMenuOpen = state.mobileMenuOpen;

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

  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle();
    } else {
      layoutActions.toggleMobileMenu();
    }
  };

  const Logo = BRAND_CONFIG.logo;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 glass-card-elevated border-b border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu toggle + Logo */}
          <div className="flex items-center gap-3">
            {showMenuToggle && (
              <button
                onClick={handleMenuToggle}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {title || BRAND_CONFIG.name}
              </span>
            </div>
          </div>

          {/* Right: Actions + Language Selector + Theme toggle + Logout */}
          <div className="flex items-center gap-3">
            {actions}
            <LanguageSelector />
            {showThemeToggle && <ThemeToggle size="sm" />}
            {userName && (
              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                {userName}
              </div>
            )}
            <button
              onClick={async () => {
                try {
                  await signOut();
                  router.push('/');
                } catch (error) {
                  console.error('Sign out failed:', error);
                }
              }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleMenuToggle}
          />

          {/* Menu Panel */}
          <div className="absolute left-0 top-0 h-full w-64 glass-card-elevated border-r border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Logo className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {BRAND_CONFIG.shortName}
                  </span>
                </div>
                <button
                  onClick={handleMenuToggle}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={handleMenuToggle}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 hover:scale-105'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-600/20 text-indigo-700 dark:text-indigo-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-white/20 dark:border-gray-700/50 space-y-2">
                {userName && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {userName}
                  </div>
                )}
                <div className="flex items-center justify-center py-2">
                  <LanguageSelector />
                </div>
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push('/');
                      handleMenuToggle();
                    } catch (error) {
                      console.error('Sign out failed:', error);
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

