"use client";

import { useSync } from "@/hooks/useSync";
import { RefreshCw, CheckCircle, AlertCircle, Cloud } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export default function SyncIndicator() {
  const { syncStatus, triggerSync } = useSync();

  const getSyncIcon = () => {
    if (syncStatus.isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />;
    }

    if (syncStatus.error) {
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }

    if (syncStatus.pendingCount > 0) {
      return <Cloud className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
  };

  const getSyncText = () => {
    if (syncStatus.isSyncing) {
      return "Syncing...";
    }

    if (syncStatus.error) {
      return "Sync failed";
    }

    if (syncStatus.pendingCount > 0) {
      return `${syncStatus.pendingCount} pending`;
    }

    if (syncStatus.lastSyncTime) {
      return `Synced ${formatDistanceToNow(syncStatus.lastSyncTime)}`;
    }

    return "Not synced";
  };

  const getTooltipText = () => {
    if (syncStatus.isSyncing) {
      return "Synchronizing with server...";
    }

    if (syncStatus.error) {
      return `Error: ${syncStatus.error}. Click to retry.`;
    }

    if (syncStatus.pendingCount > 0) {
      return `${syncStatus.pendingCount} changes pending sync. Click to sync now.`;
    }

    if (syncStatus.lastSyncTime) {
      return `Last synced: ${new Date(syncStatus.lastSyncTime).toLocaleString()}. Click to sync now.`;
    }

    return "Click to sync with server";
  };

  return (
    <button
      onClick={() => !syncStatus.isSyncing && triggerSync()}
      disabled={syncStatus.isSyncing}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      {getSyncIcon()}
      <span className="hidden text-gray-700 dark:text-gray-300 sm:inline">{getSyncText()}</span>
    </button>
  );
}
