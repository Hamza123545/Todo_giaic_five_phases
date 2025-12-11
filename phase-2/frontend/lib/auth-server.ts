/**
 * Better Auth Server Configuration
 *
 * This file configures the Better Auth server with:
 * - PostgreSQL database connection (shared with FastAPI backend)
 * - Email/password authentication
 * - JWT plugin for token generation
 * - Next.js cookies plugin for session management
 */

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

let poolInstance: Pool | null = null;
let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Get or create PostgreSQL connection pool
 * Lazy initialization to avoid build-time errors
 */
function getPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  // Validate required environment variables at runtime (not during build)
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // During build, provide a placeholder that won't be used
    // The actual error will be thrown at runtime when the route is called
    throw new Error("DATABASE_URL environment variable is required");
  }

  poolInstance = new Pool({
    connectionString: databaseUrl,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  });

  return poolInstance;
}

/**
 * Get or create Better Auth instance
 * Lazy initialization to avoid build-time errors
 */
function getAuth() {
  if (authInstance) {
    return authInstance;
  }

  // Validate required environment variables at runtime
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    // During build, this will throw but Next.js should handle it gracefully
    // At runtime, this will properly error if missing
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }

  // Get pool - will throw if DATABASE_URL is missing, but that's OK
  // The error will only occur at runtime when the route is actually called
  const database = getPool();

  /**
   * Better Auth configuration
   *
   * Features:
   * - Email/password authentication
   * - JWT tokens (7-day expiration)
   * - Session management via cookies
   * - PostgreSQL database for user storage
   */
  authInstance = betterAuth({
    // Database configuration
    database: database as Pool,

    // Secret key for signing tokens and cookies
    secret: secret,

    // Base URL for authentication endpoints
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true in production with email service
    },

    // Session configuration
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // Cache session in cookie for 5 minutes
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
    },

    // Trusted origins for CORS
    trustedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    ],

    // Plugins (order matters - nextCookies must be last)
    plugins: [
      // JWT plugin for token generation
      // Note: JWT expiration is controlled by session.expiresIn above
      // JWT plugin uses baseURL from main config automatically
      jwt(),

      // Next.js cookies plugin (MUST be last)
      nextCookies(),
    ],
  });

  return authInstance;
}

/**
 * Export auth instance (lazy initialization)
 * This will only initialize when actually used at runtime
 */
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    const authInstance = getAuth();
    const value = (authInstance as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(authInstance) : value;
  },
});

/**
 * Export auth handler types for API routes
 */
export type Auth = typeof auth;
