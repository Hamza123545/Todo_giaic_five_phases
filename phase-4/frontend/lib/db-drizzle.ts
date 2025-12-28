/**
 * Drizzle ORM Database Connection
 *
 * This file creates a Drizzle ORM instance using Neon Serverless driver.
 * Features:
 * - Serverless PostgreSQL connection via Neon
 * - Connection pooling for better performance
 * - Type-safe database operations
 * - Integrated with Better Auth schema
 * - Lazy initialization to avoid build-time errors
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/drizzle/schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Get or create Drizzle database instance
 * Lazy initialization to avoid build-time errors
 */
function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // Validate DATABASE_URL at runtime (not during build)
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  /**
   * Create Neon SQL client
   * This uses HTTP connection for serverless environments
   */
  const sql = neon(databaseUrl);

  /**
   * Drizzle database instance
   * Includes Better Auth schema for type-safe queries
   */
  dbInstance = drizzle(sql, { schema });

  return dbInstance;
}

/**
 * Export database instance (lazy initialization)
 * This will only initialize when actually used at runtime
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const dbInstance = getDb();
    // Use type assertion through unknown to avoid type errors
    const value = (dbInstance as unknown as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(dbInstance) : value;
  },
});

/**
 * Type export for database instance
 */
export type Database = typeof db;
