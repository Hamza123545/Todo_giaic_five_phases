"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
  };
  onSignOut?: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    if (isMenuOpen) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setIsMenuOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMenuOpen]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Tasks", href: "/dashboard" },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Todo App
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center">
            {/* Dark Mode Toggle */}
            <div className="hidden md:block mr-2">
              <DarkModeToggle />
            </div>

            {/* User info and sign out for desktop */}
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-4">
                    Welcome, {user.name}
                  </span>
                  <button
                    onClick={onSignOut}
                    className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    href="/signin"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <DarkModeToggle />
              <button
                type="button"
                className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-5">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <button
                    onClick={() => {
                      onSignOut?.();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
