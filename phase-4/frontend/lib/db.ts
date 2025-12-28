import { openDB, DBSchema, IDBPDatabase } from "idb";
import { TaskUI } from "@/types";

// Database schema interface
interface TodoAppDB extends DBSchema {
  tasks: {
    key: number;
    value: TaskUI;
    indexes: { "by-user": string };
  };
  pendingOperations: {
    key: number;
    value: PendingOperation;
    indexes: { "by-timestamp": number };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: string | number | boolean;
      updatedAt: number;
    };
  };
}

export interface PendingOperation {
  id?: number;
  type: "create" | "update" | "delete" | "complete";
  taskId?: number;
  data?: Partial<TaskUI>;
  timestamp: number;
  retries: number;
}

const DB_NAME = "todo-app-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TodoAppDB> | null = null;

// Initialize database
export async function initDB(): Promise<IDBPDatabase<TodoAppDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<TodoAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create tasks store
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
          taskStore.createIndex("by-user", "user_id");
        }

        // Create pending operations store
        if (!db.objectStoreNames.contains("pendingOperations")) {
          const opStore = db.createObjectStore("pendingOperations", {
            keyPath: "id",
            autoIncrement: true,
          });
          opStore.createIndex("by-timestamp", "timestamp");
        }

        // Create metadata store
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
      },
    });

    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    throw error;
  }
}

// Tasks operations
export async function getAllTasksFromDB(userId: string): Promise<TaskUI[] | null> {
  try {
    const db = await initDB();
    const tasks = await db.getAllFromIndex("tasks", "by-user", userId);
    return tasks;
  } catch (error) {
    console.error("Failed to get tasks from IndexedDB:", error);
    return null;
  }
}

export async function getTaskByIdFromDB(taskId: number): Promise<TaskUI | null> {
  try {
    const db = await initDB();
    const task = await db.get("tasks", taskId);
    return task || null;
  } catch (error) {
    console.error("Failed to get task from IndexedDB:", error);
    return null;
  }
}

export async function saveTaskToDB(task: TaskUI): Promise<boolean> {
  try {
    const db = await initDB();
    await db.put("tasks", task);
    return true;
  } catch (error) {
    console.error("Failed to save task to IndexedDB:", error);
    return false;
  }
}

export async function saveTasksToDB(tasks: TaskUI[]): Promise<boolean> {
  try {
    const db = await initDB();
    const tx = db.transaction("tasks", "readwrite");

    await Promise.all([...tasks.map((task) => tx.store.put(task)), tx.done]);

    return true;
  } catch (error) {
    console.error("Failed to save tasks to IndexedDB:", error);
    return false;
  }
}

export async function deleteTaskFromDB(taskId: number): Promise<boolean> {
  try {
    const db = await initDB();
    await db.delete("tasks", taskId);
    return true;
  } catch (error) {
    console.error("Failed to delete task from IndexedDB:", error);
    return false;
  }
}

export async function clearAllTasksFromDB(): Promise<boolean> {
  try {
    const db = await initDB();
    await db.clear("tasks");
    return true;
  } catch (error) {
    console.error("Failed to clear tasks from IndexedDB:", error);
    return false;
  }
}

// Pending operations
export async function addPendingOperation(
  operation: Omit<PendingOperation, "id">
): Promise<number | null> {
  try {
    const db = await initDB();
    const id = await db.add("pendingOperations", operation as PendingOperation);
    return id;
  } catch (error) {
    console.error("Failed to add pending operation:", error);
    return null;
  }
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const db = await initDB();
    const operations = await db.getAllFromIndex("pendingOperations", "by-timestamp");
    return operations;
  } catch (error) {
    console.error("Failed to get pending operations:", error);
    return [];
  }
}

export async function updatePendingOperation(operation: PendingOperation): Promise<boolean> {
  try {
    const db = await initDB();
    await db.put("pendingOperations", operation);
    return true;
  } catch (error) {
    console.error("Failed to update pending operation:", error);
    return false;
  }
}

export async function deletePendingOperation(id: number): Promise<boolean> {
  try {
    const db = await initDB();
    await db.delete("pendingOperations", id);
    return true;
  } catch (error) {
    console.error("Failed to delete pending operation:", error);
    return false;
  }
}

export async function clearPendingOperations(): Promise<boolean> {
  try {
    const db = await initDB();
    await db.clear("pendingOperations");
    return true;
  } catch (error) {
    console.error("Failed to clear pending operations:", error);
    return false;
  }
}

// Metadata operations
export async function setMetadata(key: string, value: string | number | boolean): Promise<boolean> {
  try {
    const db = await initDB();
    await db.put("metadata", {
      key,
      value,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Failed to set metadata:", error);
    return false;
  }
}

export async function getMetadata(key: string): Promise<string | number | boolean | null> {
  try {
    const db = await initDB();
    const item = await db.get("metadata", key);
    return item?.value ?? null;
  } catch (error) {
    console.error("Failed to get metadata:", error);
    return null;
  }
}

export async function deleteMetadata(key: string): Promise<boolean> {
  try {
    const db = await initDB();
    await db.delete("metadata", key);
    return true;
  } catch (error) {
    console.error("Failed to delete metadata:", error);
    return false;
  }
}

// Clear entire database
export async function clearDatabase(): Promise<boolean> {
  try {
    const db = await initDB();
    await Promise.all([db.clear("tasks"), db.clear("pendingOperations"), db.clear("metadata")]);
    return true;
  } catch (error) {
    console.error("Failed to clear database:", error);
    return false;
  }
}
