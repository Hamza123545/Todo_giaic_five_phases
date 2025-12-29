"use client";

import { useState, useEffect, useCallback } from "react";
import { syncService, SyncStatus } from "@/lib/syncService";

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    successCount: 0,
    error: null,
  });

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe((status) => {
      setSyncStatus(status);
    });

    // Start auto-sync on mount
    syncService.startAutoSync(30000); // Every 30 seconds

    return () => {
      unsubscribe();
      syncService.stopAutoSync();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    await syncService.triggerSync();
  }, []);

  const queueOperation = useCallback(
    async (operation: Parameters<typeof syncService.queueOperation>[0]) => {
      await syncService.queueOperation(operation);
    },
    []
  );

  const syncFromServer = useCallback(async (userId: string) => {
    return await syncService.syncTasksFromServer(userId);
  }, []);

  return {
    syncStatus,
    triggerSync,
    queueOperation,
    syncFromServer,
  };
}
