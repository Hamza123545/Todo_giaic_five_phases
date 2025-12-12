"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    // Check if already installed
    if (checkStandalone()) {
      return; // Don't show button if already installed
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // IMPORTANT: Don't preventDefault() - this allows browser to show install icon in address bar
      // The browser will automatically show the install icon when PWA criteria are met
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setShowButton(true);
      
      // Browser will show install icon in address bar automatically
      // Our custom button provides an alternative way to trigger the same prompt
      // Both will work - browser's native icon and our custom button
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowButton(false);
      setIsStandalone(true);
    };

    // Check if service worker is registered (required for PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Service worker is registered, listen for install prompt
          window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        } else {
          // No service worker, but still show button for manual install
          setShowButton(true);
        }
      });
    } else {
      // Service workers not supported, but show button for manual install
      setShowButton(true);
    }

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger browser's native install prompt
      // This is the same prompt that appears when clicking browser's install icon
      try {
        // Show the native browser install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("User accepted the install prompt");
          // App will be installed, handleAppInstalled will fire
        } else {
          console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt after use
        setDeferredPrompt(null);
        setShowButton(false);
      } catch (error) {
        console.error("Error showing install prompt:", error);
        // Fall through to manual install instructions
        showManualInstallInstructions();
      }
    } else {
      // No browser prompt available, show manual instructions
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      alert(
        "To install this app:\n\n1. Tap the Share button (square with arrow)\n2. Tap 'Add to Home Screen'\n3. Tap 'Add'"
      );
    } else if (isAndroid) {
      alert(
        "To install this app:\n\n1. Tap the menu (3 dots) in your browser\n2. Tap 'Install app' or 'Add to Home screen'\n3. Tap 'Install'"
      );
    } else {
      alert(
        "To install this app:\n\n1. Look for the install icon in your browser's address bar\n2. Click it and follow the prompts\n\nOr use your browser's menu to find 'Install' option"
      );
    }
  };

  // Don't show if already installed
  if (isStandalone || !showButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
      aria-label="Install Todo App"
      title="Install this app on your device"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
}

