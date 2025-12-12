"use client";

import {
  getPendingOperations,
  deletePendingOperation,
  updatePendingOperation,
  addPendingOperation,
  PendingOperation,
  saveTasksToDB,
  setMetadata,
} from "./db";
import { api } from "./api";

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  failedCount: number;
  successCount: number;
  error: string | null;
}

export type SyncStatusCallback = (status: SyncStatus) => void;

class SyncService {
  private isSyncing = false;
  private statusCallbacks: Set<SyncStatusCallback> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.triggerSync());
      window.addEventListener("offline", () => this.stopAutoSync());

      // Register background sync if available
      this.registerBackgroundSync();
    }
  }

  // Subscribe to sync status updates
  subscribe(callback: SyncStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  // Notify all subscribers of status change
  private notifyStatusChange(status: Partial<SyncStatus>): void {
    const currentStatus = this.getCurrentStatus();
    const newStatus = { ...currentStatus, ...status };

    this.statusCallbacks.forEach((callback) => {
      try {
        callback(newStatus);
      } catch (error) {
        console.error("Error in sync status callback:", error);
      }
    });
  }

  // Get current sync status
  private getCurrentStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: null,
      pendingCount: 0,
      failedCount: 0,
      successCount: 0,
      error: null,
    };
  }

  // Add operation to pending queue
  async queueOperation(operation: Omit<PendingOperation, "id">): Promise<void> {
    try {
      await addPendingOperation(operation);
      await setMetadata("hasPendingChanges", true);

      // Try to sync immediately if online
      if (navigator.onLine) {
        this.triggerSync();
      }
    } catch (error) {
      console.error("Failed to queue operation:", error);
      throw error;
    }
  }

  // Trigger sync manually
  async triggerSync(): Promise<void> {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return;
    }

    if (!navigator.onLine) {
      console.log("Cannot sync while offline");
      return;
    }

    await this.performSync();
  }

  // Perform the actual sync
  private async performSync(): Promise<void> {
    this.isSyncing = true;
    this.notifyStatusChange({ isSyncing: true, error: null });

    let successCount = 0;
    let failedCount = 0;

    try {
      // Get all pending operations
      const operations = await getPendingOperations();

      if (operations.length === 0) {
        console.log("No pending operations to sync");
        await setMetadata("hasPendingChanges", false);
        return;
      }

      this.notifyStatusChange({ pendingCount: operations.length });

      // Process each operation
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          await deletePendingOperation(operation.id!);
          successCount++;
        } catch (error) {
          console.error("Failed to process operation:", operation, error);

          // Increment retry count
          const updatedOp = {
            ...operation,
            retries: operation.retries + 1,
          };

          // Delete if max retries reached
          if (updatedOp.retries >= this.maxRetries) {
            console.error("Max retries reached for operation:", operation.id);
            await deletePendingOperation(operation.id!);
            failedCount++;
          } else {
            // Update with incremented retry count
            await updatePendingOperation(updatedOp);
            failedCount++;
          }
        }
      }

      // Update metadata
      const remainingOps = await getPendingOperations();
      const hasPendingChanges = remainingOps.length > 0;
      await setMetadata("hasPendingChanges", hasPendingChanges);
      await setMetadata("lastSyncTime", Date.now());

      this.notifyStatusChange({
        successCount,
        failedCount,
        lastSyncTime: Date.now(),
        pendingCount: remainingOps.length,
      });

      console.log(`Sync completed: ${successCount} successful, ${failedCount} failed`);
    } catch (error) {
      console.error("Sync failed:", error);
      this.notifyStatusChange({
        error: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange({ isSyncing: false });
    }
  }

  // Process individual operation
  private async processOperation(operation: PendingOperation): Promise<void> {
    // This would need to extract userId from somewhere - typically from auth context
    // For now, we'll assume it's stored in the operation data
    const userId = operation.data?.user_id || "current-user";

    switch (operation.type) {
      case "create":
        if (!operation.data || !operation.data.title) {
          throw new Error("No data or title for create operation");
        }
        // Convert Partial<TaskUI> to TaskFormData
        const createData = {
          title: operation.data.title,
          description: operation.data.description,
          priority: operation.data.priority,
          due_date: operation.data.due_date,
          tags: operation.data.tags,
        };
        await api.createTask(userId, createData);
        break;

      case "update":
        if (!operation.taskId || !operation.data) {
          throw new Error("No task ID or data for update operation");
        }
        await api.updateTask(userId, operation.taskId, operation.data);
        break;

      case "delete":
        if (!operation.taskId) {
          throw new Error("No task ID for delete operation");
        }
        await api.deleteTask(userId, operation.taskId);
        break;

      case "complete":
        if (!operation.taskId || operation.data?.completed === undefined) {
          throw new Error("No task ID or completed status for complete operation");
        }
        await api.toggleTaskComplete(userId, operation.taskId, operation.data.completed);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Sync tasks from server to local storage
  async syncTasksFromServer(userId: string): Promise<boolean> {
    try {
      const response = await api.getTasks(userId, {});
      if (!response.success || !response.data) {
        throw new Error("Failed to fetch tasks from server");
      }

      // Save tasks to IndexedDB
      await saveTasksToDB(response.data.items);
      await setMetadata("lastSyncTime", Date.now());

      this.notifyStatusChange({ lastSyncTime: Date.now() });
      return true;
    } catch (error) {
      console.error("Failed to sync tasks from server:", error);
      return false;
    }
  }

  // Start auto-sync (periodic sync when online)
  startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, intervalMs);
  }

  // Stop auto-sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Register background sync (if supported)
  private async registerBackgroundSync(): Promise<void> {
    if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (
          registration as ServiceWorkerRegistration & {
            sync?: { register: (tag: string) => Promise<void> };
          }
        ).sync;
        if (syncManager) {
          await syncManager.register("sync-tasks");
        }
        console.log("Background sync registered");
      } catch (error) {
        console.error("Failed to register background sync:", error);
      }
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
