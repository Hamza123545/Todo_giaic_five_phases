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
    console.error("BETTER_AUTH_SECRET is missing");
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing");
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("Initializing Better Auth with:", {
    hasSecret: !!secret,
    hasDatabaseUrl: !!databaseUrl,
    baseURL: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000",
  });

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
      sendResetPassword: async ({ user, url }) => {
        // TODO: Configure email service (SendGrid, Postmark, etc.) in production
        // For now, log the reset URL (in production, send email)
        console.log(`Password reset link for ${user.email}: ${url}`);
        // In production, implement actual email sending:
        // await sendEmail({
        //   to: user.email,
        //   subject: "Reset your password",
        //   html: `<a href="${url}">Reset Password</a>`,
        // });
      },
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
    // Include all possible Vercel URLs (production, preview, etc.)
    trustedOrigins: [
      // Production domain (always include)
      "https://todo-giaic-five-phases.vercel.app",
      // Environment variable URLs
      ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      // Backend API URL
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      // Localhost for development
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],

    // Plugins (order matters - nextCookies must be last)
    plugins: [
      // JWT plugin for token generation
      // Note: JWT expiration is controlled by session.expiresIn above
      // JWT plugin uses baseURL from main config automatically
      // Uses RS256 algorithm by default
      // If BETTER_AUTH_SECRET changes, delete old keys from jwks table
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
