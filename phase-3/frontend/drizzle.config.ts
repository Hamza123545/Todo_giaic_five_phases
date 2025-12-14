/**
 * Drizzle Kit Configuration
 *
 * This configures Drizzle Kit for:
 * - Schema generation from TypeScript definitions
 * - Migration generation
 * - Database introspection
 * - Drizzle Studio
 */

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

export default defineConfig({
  // Schema location - Better Auth tables
  schema: "./drizzle/schema.ts",

  // Output directory for generated migrations
  out: "./drizzle/migrations",

  // Database dialect
  dialect: "postgresql",

  // Database credentials
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Verbose logging for debugging
  verbose: true,

  // Strict mode for type checking
  strict: true,
});
