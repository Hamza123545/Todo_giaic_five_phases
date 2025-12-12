/**
 * Better Auth Server Configuration
 *
 * This file configures the Better Auth server with:
 * - Drizzle ORM adapter for type-safe database operations
 * - Neon Serverless PostgreSQL (shared with FastAPI backend)
 * - Email/password authentication
 * - JWT plugin for token generation
 * - Next.js cookies plugin for session management
 */

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db-drizzle";
import * as schema from "@/drizzle/schema";

let authInstance: ReturnType<typeof betterAuth> | null = null;

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

  /**
   * Better Auth configuration with Drizzle ORM
   *
   * Features:
   * - Drizzle ORM adapter for type-safe database operations
   * - Email/password authentication
   * - JWT tokens (7-day expiration)
   * - Session management via cookies
   * - Neon Serverless PostgreSQL for user storage
   */
  authInstance = betterAuth({
    // Database configuration using Drizzle adapter
    database: drizzleAdapter(db, {
      provider: "pg", // PostgreSQL provider
      schema: schema, // Better Auth schema
    }),

    // Secret key for signing tokens and cookies
    secret: secret,

    // Base URL for authentication endpoints
    // Auto-detect from Vercel or use environment variable
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 
             (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

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
      process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
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
