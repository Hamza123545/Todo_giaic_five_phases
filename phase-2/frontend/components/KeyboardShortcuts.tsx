"use client";

import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface KeyboardShortcutsProps {
  onSearchToggle?: () => void;
  onNewTask?: () => void;
}

export default function KeyboardShortcuts({ onSearchToggle, onNewTask }: KeyboardShortcutsProps) {
  // Define keyboard shortcuts
  useHotkeys("ctrl+k, cmd+k", (e) => {
    e.preventDefault();
    onSearchToggle?.();
  });

  useHotkeys("ctrl+n, cmd+n", (e) => {
    e.preventDefault();
    onNewTask?.();
  });

  // Additional shortcuts can be added here
  useEffect(() => {
    // Component mount/unmount logic if needed
  }, []);

  return null; // This component doesn't render anything visible, it just handles keyboard events
}
