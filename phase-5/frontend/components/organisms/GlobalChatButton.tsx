"use client";

/**
 * Global Chat Button Component
 * 
 * Floating chat button that appears on all pages
 * Opens a chat modal overlay when clicked
 * Uses the same ChatKit API as the /chat page
 */

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatKitWidget } from "@/components/chatkit";
import { GlassCard } from "@/components/atoms/GlassCard";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/types";
import { usePathname } from "next/navigation";

export function GlobalChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  // Don't show on public routes or chat page
  const publicRoutes = ["/", "/signin", "/signup", "/chat"];
  const shouldShow = !publicRoutes.includes(pathname);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            createdAt: currentUser.createdAt?.toISOString(),
            updatedAt: currentUser.updatedAt?.toISOString(),
          });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to check auth:", error);
        setIsAuthenticated(false);
      }
    }

    if (shouldShow) {
      checkAuth();
    }
  }, [shouldShow]);

  if (!shouldShow || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 md:w-16 md:h-16 rounded-full",
          "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600",
          "text-white shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-110 active:scale-95",
          "backdrop-blur-sm border-2 border-white/20 dark:border-gray-700/50",
          isOpen && "hidden"
        )}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Modal Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Modal */}
          <div
            className={cn(
              "fixed z-[9999]",
              "inset-4 md:inset-auto md:bottom-6 md:right-6",
              "md:w-full md:max-w-md",
              "md:h-[600px]",
              "flex flex-col",
              "animate-in slide-in-from-bottom-4 fade-in duration-300"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard variant="elevated" className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ask me anything about your tasks
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Chat Widget */}
              <div className="flex-1 overflow-hidden">
                <ChatKitWidget className="h-full w-full" />
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </>
  );
}

