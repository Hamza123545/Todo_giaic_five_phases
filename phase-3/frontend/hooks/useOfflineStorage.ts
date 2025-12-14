"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllTasksFromDB,
  saveTasksToDB,
  saveTaskToDB,
  deleteTaskFromDB,
  getMetadata,
  setMetadata,
} from "@/lib/db";
import { TaskUI } from "@/types";

export interface OfflineStorageState {
  isInitialized: boolean;
  lastSyncTime: number | null;
  hasPendingChanges: boolean;
}

export function useOfflineStorage(userId: string | null) {
  const [state, setState] = useState<OfflineStorageState>({
    isInitialized: false,
    lastSyncTime: null,
    hasPendingChanges: false,
  });

  // Initialize offline storage
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const lastSync = await getMetadata("lastSyncTime");
        const hasPending = await getMetadata("hasPendingChanges");

        setState({
          isInitialized: true,
          lastSyncTime: typeof lastSync === "number" ? lastSync : Date.now(),
          hasPendingChanges: hasPending === true,
        });
      } catch (error) {
        console.error("Failed to initialize offline storage:", error);
        setState((prev) => ({ ...prev, isInitialized: true }));
      }
    };

    initializeStorage();
  }, []);

  // Load tasks from IndexedDB
  const loadTasksFromStorage = useCallback(async (): Promise<TaskUI[] | null> => {
    if (!userId) return null;

    try {
      const tasks = await getAllTasksFromDB(userId);
      return tasks;
    } catch (error) {
      console.error("Failed to load tasks from storage:", error);
      return null;
    }
  }, [userId]);

  // Save tasks to IndexedDB
  const saveTasksToStorage = useCallback(async (tasks: TaskUI[]): Promise<boolean> => {
    try {
      const success = await saveTasksToDB(tasks);
      if (success) {
        await setMetadata("lastSyncTime", Date.now());
        setState((prev) => ({ ...prev, lastSyncTime: Date.now() }));
      }
      return success;
    } catch (error) {
      console.error("Failed to save tasks to storage:", error);
      return false;
    }
  }, []);

  // Save single task to IndexedDB
  const saveTaskToStorage = useCallback(async (task: TaskUI): Promise<boolean> => {
    try {
      const success = await saveTaskToDB(task);
      return success;
    } catch (error) {
      console.error("Failed to save task to storage:", error);
      return false;
    }
  }, []);

  // Delete task from IndexedDB
  const deleteTaskFromStorage = useCallback(async (taskId: number): Promise<boolean> => {
    try {
      const success = await deleteTaskFromDB(taskId);
      return success;
    } catch (error) {
      console.error("Failed to delete task from storage:", error);
      return false;
    }
  }, []);

  // Mark as having pending changes
  const markPendingChanges = useCallback(async (hasPending: boolean) => {
    try {
      await setMetadata("hasPendingChanges", hasPending);
      setState((prev) => ({ ...prev, hasPendingChanges: hasPending }));
    } catch (error) {
      console.error("Failed to mark pending changes:", error);
    }
  }, []);

  // Update last sync time
  const updateLastSyncTime = useCallback(async () => {
    const now = Date.now();
    try {
      await setMetadata("lastSyncTime", now);
      setState((prev) => ({ ...prev, lastSyncTime: now }));
    } catch (error) {
      console.error("Failed to update last sync time:", error);
    }
  }, []);

  return {
    state,
    loadTasksFromStorage,
    saveTasksToStorage,
    saveTaskToStorage,
    deleteTaskFromStorage,
    markPendingChanges,
    updateLastSyncTime,
  };
}
