"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt after a delay
      setTimeout(() => {
        // Check if user has previously dismissed the prompt
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 5000); // Show after 5 seconds
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      localStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember user dismissed the prompt
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3
            id="pwa-install-title"
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            Install Todo App
          </h3>
          <p id="pwa-install-description" className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Install this app on your device for quick access and offline use.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Dismiss install prompt"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
