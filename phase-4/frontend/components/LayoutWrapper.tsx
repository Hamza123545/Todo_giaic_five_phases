"use client";

/**
 * LayoutWrapper Component
 *
 * Conditionally renders Sidebar/TopBar only on authenticated pages
 * Landing page, signin, signup pages don't show the sidebar
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { TopBar } from "@/components/organisms/TopBar";
import { useLayoutState } from "@/hooks/useLayoutState";
import { cn } from "@/lib/utils";

// Pages that should NOT show the sidebar/topbar
const PUBLIC_PAGES = ["/", "/signin", "/signup"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, actions } = useLayoutState();

  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const showSidebar = !isPublicPage;

  useEffect(() => {
    actions.setActiveRoute(pathname);
    actions.closeMobileMenu();
  }, [pathname, actions]);

  if (isPublicPage) {
    // Public pages (landing, signin, signup) - no sidebar
    return <main className="min-h-screen">{children}</main>;
  }

  // Authenticated pages - show sidebar/topbar
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col transition-all duration-300",
          state.sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <Sidebar
          isCollapsed={state.sidebarCollapsed}
          onCollapseToggle={actions.toggleSidebar}
          activeItem={state.activeRoute}
        />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <TopBar
          showMenuToggle
          onMenuToggle={actions.toggleMobileMenu}
          showThemeToggle
        />
      </header>

      {/* Mobile Menu Overlay */}
      {state.mobileMenuOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={actions.closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 lg:hidden",
          state.mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          isCollapsed={false}
          onCollapseToggle={actions.toggleMobileMenu}
          activeItem={state.activeRoute}
        />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          state.sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
          "pt-16 lg:pt-0" // Adjust for fixed top bar on mobile
        )}
      >
        {children}
      </main>
    </>
  );
}

