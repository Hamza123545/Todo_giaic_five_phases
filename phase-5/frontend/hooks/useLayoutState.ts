'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface LayoutState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeRoute: string;
}

export interface LayoutActions {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setActiveRoute: (route: string) => void;
  collapseSidebar: (collapsed: boolean) => void;
  closeMobileMenu: () => void;
}

export interface UseLayoutState {
  state: LayoutState;
  actions: LayoutActions;
}

export function useLayoutState(): UseLayoutState {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const collapseSidebar = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const setActiveRoute = useCallback((route: string) => {
    // Route is automatically set by pathname
  }, []);

  return {
    state: {
      sidebarCollapsed,
      mobileMenuOpen,
      activeRoute: pathname,
    },
    actions: {
      toggleSidebar,
      toggleMobileMenu,
      setActiveRoute,
      collapseSidebar,
      closeMobileMenu,
    },
  };
}

