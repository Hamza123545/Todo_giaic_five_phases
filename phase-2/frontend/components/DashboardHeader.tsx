"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import { signOut } from "@/lib/auth";
import {
  LayoutDashboard,
  CheckSquare,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Home,
} from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface DashboardHeaderProps {
  user?: User;
  onSignOut?: () => void;
}

export default function DashboardHeader({ user, onSignOut }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignOut?.();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/dashboard", icon: CheckSquare },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5"
          : "border-transparent bg-background/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hidden sm:block">
                Todo App
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <div className="hidden md:block">
              <DarkModeToggle />
            </div>

            {/* User info and actions for desktop */}
            {user && (
              <div className="hidden md:flex md:items-center md:gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                    {user.name?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:block">
                    {user.name}
                  </span>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </motion.button>
              </div>
            )}

            {/* Home Link */}
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Home className="h-4 w-4" />
              </motion.button>
            </Link>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <DarkModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border py-4"
            >
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                {user && (
                  <>
                    <div className="border-t border-border my-2" />
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
