"use client";

/**
 * Dropdown Menu Component (Shadcn UI)
 *
 * A customizable dropdown menu component with keyboard navigation
 * and accessibility features.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ className, children, open, onOpenChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open || false);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{ isOpen?: boolean; setIsOpen?: (open: boolean) => void }>,
            {
              isOpen,
              setIsOpen: handleOpenChange,
            }
          );
        }
        return child;
      })}
    </div>
  );
});
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
    asChild?: boolean;
  }
>(({ className, children, isOpen, setIsOpen, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    const originalOnClick = child.props.onClick;
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      setIsOpen?.(!isOpen);
      // Call original onClick if it exists
      if (originalOnClick) {
        originalOnClick(e);
      }
    };

    // Clone element without ref to avoid refs during render
    return React.cloneElement(child, {
      ...child.props,
      onClick: handleClick,
      "aria-expanded": isOpen,
      "aria-haspopup": "true",
    } as Partial<React.HTMLAttributes<HTMLElement>>);
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(className)}
      onClick={() => setIsOpen?.(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
    align?: "start" | "center" | "end";
  }
>(({ className, children, isOpen, setIsOpen, align = "end", ...props }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen?.(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen?.(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  // Pass setIsOpen to children (DropdownMenuItem components)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(
        child as React.ReactElement<{ setIsOpen?: (open: boolean) => void }>,
        {
          setIsOpen,
        }
      );
    }
    return child;
  });

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card p-1 shadow-lg mt-1",
        alignmentClasses[align],
        className
      )}
      role="menu"
      {...props}
    >
      {childrenWithProps}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: () => void;
    disabled?: boolean;
    setIsOpen?: (open: boolean) => void;
  }
>(({ className, children, onSelect, disabled, setIsOpen, ...props }, ref) => {
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      // Close dropdown first
      if (setIsOpen) {
        setIsOpen(false);
      }
      // Then call onSelect (which might be async)
      if (onSelect) {
        setTimeout(() => {
          onSelect();
        }, 0);
      }
    }
  }, [disabled, onSelect, setIsOpen]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700",
        className
      )}
      onClick={handleClick}
      role="menuitem"
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700", className)}
    role="separator"
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-white", className)}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
