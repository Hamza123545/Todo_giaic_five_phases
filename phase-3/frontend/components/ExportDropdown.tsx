"use client";

/**
 * Export Dropdown Component
 *
 * Provides a dropdown menu with export options for tasks.
 * Supports JSON, CSV, and PDF export formats.
 * Features:
 * - Loading states during export
 * - Success/error toast notifications
 * - Animated dropdown menu
 * - Keyboard navigation
 */

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, FileJson, FileText, FileType, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ExportFormat } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExportDropdownProps {
  userId: string;
  disabled?: boolean;
  className?: string;
}

function ExportDropdown({ userId, disabled = false, className = "" }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 280; // Approximate dropdown height
      const dropdownWidth = Math.max(rect.width, 200); // Minimum width
      
      // Check available space
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;
      
      // Determine vertical position - prefer opening above for sidebar buttons
      let top: number;
      let shouldOpenAbove = false;
      
      // Check if button is in right side of viewport (likely sidebar)
      const isInSidebar = rect.left > viewportWidth * 0.6;
      
      // For sidebar buttons, prefer opening above
      if (isInSidebar) {
        // In sidebar, prefer above unless there's not enough space
        if (spaceAbove >= dropdownHeight) {
          shouldOpenAbove = true;
        } else if (spaceBelow >= dropdownHeight) {
          shouldOpenAbove = false;
        } else {
          // Not enough space either way, use whichever has more space
          shouldOpenAbove = spaceAbove > spaceBelow;
        }
      } else {
        // For main content area, use standard logic
        // If button is in lower 50% of viewport, prefer opening above
        if (rect.top > viewportHeight * 0.5) {
          shouldOpenAbove = true;
        } else if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          shouldOpenAbove = true;
        } else if (spaceBelow < dropdownHeight && spaceAbove < dropdownHeight) {
          // Not enough space either way, prefer below and adjust
          shouldOpenAbove = false;
        }
      }
      
      if (shouldOpenAbove) {
        // Open above button
        top = rect.top + window.scrollY - dropdownHeight - 8;
      } else {
        // Open below button
        top = rect.bottom + window.scrollY + 8;
      }
      
      // Ensure dropdown doesn't go off-screen vertically
      const minTop = window.scrollY + 8;
      const maxTop = window.scrollY + viewportHeight - dropdownHeight - 8;
      
      if (top < minTop) {
        top = minTop;
      }
      if (top > maxTop) {
        top = maxTop;
      }
      
      // Determine horizontal position - align with button left edge
      let left = rect.left + window.scrollX;
      
      // If dropdown would overflow right, align to button right edge instead
      if (left + dropdownWidth > viewportWidth) {
        left = rect.right + window.scrollX - dropdownWidth;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (left < window.scrollX) {
        left = window.scrollX + 8;
      }
      
      setPosition({
        top,
        left,
        width: dropdownWidth,
      });
    } else {
      setPosition(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting || !isMountedRef.current) return;

    // Close dropdown
    setIsOpen(false);

    // Set exporting state
    setIsExporting(true);
    setExportingFormat(format);

    try {
      const blob = await api.exportTasks(userId, format);

      // Check if still mounted before updating state
      if (!isMountedRef.current) return;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Determine file extension
      const extension = format === "json" ? "json" : format === "csv" ? "csv" : "pdf";
      a.download = `tasks_export_${new Date().toISOString().split("T")[0]}.${extension}`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (isMountedRef.current) {
        toast({
          type: "success",
          title: "Export Successful",
          description: `Tasks exported as ${format.toUpperCase()}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      if (isMountedRef.current) {
        toast({
          type: "error",
          title: "Export Failed",
          description: error instanceof Error ? error.message : "Failed to export tasks",
          duration: 5000,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsExporting(false);
        setExportingFormat(null);
      }
    }
  };

  const exportOptions = [
    {
      format: "json" as ExportFormat,
      label: "JSON Export",
      icon: FileJson,
      description: "Export as JSON file",
    },
    {
      format: "csv" as ExportFormat,
      label: "CSV Export",
      icon: FileText,
      description: "Export as CSV spreadsheet",
    },
    {
      format: "pdf" as ExportFormat,
      label: "PDF Export",
      icon: FileType,
      description: "Export as PDF document",
    },
  ];

  return (
    <>
      <div className={cn("relative", className)}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            ref={buttonRef}
            variant="outline"
            disabled={disabled || isExporting}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-start"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting {exportingFormat?.toUpperCase()}...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Render dropdown in portal to avoid overflow issues */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && position && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[9998] bg-black/5"
                  onClick={() => setIsOpen(false)}
                />
                {/* Dropdown Menu */}
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="fixed z-[9999] min-w-[200px] rounded-lg border border-border bg-card shadow-xl dark:bg-gray-800 dark:border-gray-700"
                  style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                    maxHeight: "300px",
                  }}
                >
                  <div className="max-h-[280px] overflow-y-auto">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm font-semibold text-foreground border-b border-border mb-1 sticky top-0 bg-card">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Export Tasks
                        </div>
                      </div>

                      <div className="space-y-1">
                        {exportOptions.map((option) => {
                          const Icon = option.icon;
                          const isCurrentlyExporting =
                            isExporting && exportingFormat === option.format;

                          return (
                            <motion.button
                              key={option.format}
                              onClick={() => handleExport(option.format)}
                              disabled={isExporting}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                                "hover:bg-accent focus:bg-accent focus:outline-none",
                                disabled || isExporting
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              )}
                            >
                              {isCurrentlyExporting ? (
                                <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
                              ) : (
                                <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">
                                  {isCurrentlyExporting ? "Exporting..." : option.label}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export default ExportDropdown;
