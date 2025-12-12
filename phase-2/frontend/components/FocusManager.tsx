"use client";

import { useEffect, useRef } from "react";

interface FocusManagerProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export default function FocusManager({
  children,
  autoFocus = false,
  restoreFocus = true,
}: FocusManagerProps) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (autoFocus) {
      const autoFocusElement = document.querySelector("[data-autofocus]") as HTMLElement;
      if (autoFocusElement) {
        autoFocusElement.focus();
      }
    }

    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);

  return <div tabIndex={-1}>{children}</div>;
}
