"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true; // Default to online during SSR
  });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-green-500 text-white dark:bg-green-600"
          : "bg-red-500 text-white dark:bg-red-600"
      }`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">
            You are offline. Changes will sync when you reconnect.
          </span>
        </>
      )}
    </div>
  );
}
