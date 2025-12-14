/**
 * ExportImportControls Component
 *
 * Provides UI controls for exporting and importing tasks
 * Features:
 * - Export to CSV or JSON format
 * - Import from CSV or JSON with validation
 * - Progress indicators during export/import
 * - Error handling for invalid files
 * - Success/error feedback via toast notifications
 */

"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, FileText, FileJson, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { ExportFormat, ImportResult } from "@/types";

interface ExportImportControlsProps {
  onExport: (format: ExportFormat) => Promise<void>;
  onImport: (file: File) => Promise<ImportResult>;
  disabled?: boolean;
  className?: string;
}

export function ExportImportControls({
  onExport,
  onImport,
  disabled = false,
  className = "",
}: ExportImportControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setImportError(null);

    try {
      await onExport(format);
    } catch (error) {
      console.error("Export failed:", error);
      setImportError(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (disabled || isImporting) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".csv", ".json"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      setImportError("Invalid file type. Please select a CSV or JSON file.");
      event.target.value = ""; // Reset input
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const result = await onImport(file);

      if (result.errors && result.errors > 0) {
        setImportError(
          `Import completed with ${result.errors} error(s). ${result.imported} task(s) imported successfully.`
        );
      }
    } catch (error) {
      console.error("Import failed:", error);
      setImportError(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
      event.target.value = ""; // Reset input for next import
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Export Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Tasks
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={disabled || isExporting || isImporting}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              disabled={disabled || isExporting || isImporting}
              className="flex-1"
            >
              <FileJson className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export JSON"}
            </Button>
          </div>
        </div>

        {/* Import Controls */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Tasks
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={disabled || isExporting || isImporting}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? "Importing..." : "Import File"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select file to import"
          />
        </div>
      </div>

      {/* Error Display */}
      {importError && (
        <div
          className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{importError}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          <strong>Export:</strong> Download your tasks as CSV or JSON file
        </p>
        <p>
          <strong>Import:</strong> Upload a CSV or JSON file with tasks (title, description,
          priority, due_date, tags, completed)
        </p>
      </div>
    </div>
  );
}

export default ExportImportControls;
