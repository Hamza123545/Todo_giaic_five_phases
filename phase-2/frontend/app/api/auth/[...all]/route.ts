/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all Better Auth requests:
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - GET /api/auth/.well-known/jwks.json (for JWT verification)
 *
 * The route is automatically handled by Better Auth's toNextJsHandler.
 */

import { toNextJsHandler } from "better-auth/next-js";

/**
 * Lazy load auth handler to avoid build-time initialization
 * This ensures DATABASE_URL is only checked at runtime, not during build
 */
let handlers: {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
} | null = null;

async function getHandlers() {
  if (!handlers) {
    // Dynamic import to avoid build-time execution
    const { auth } = await import("@/lib/auth-server");
    handlers = toNextJsHandler(auth.handler);
  }
  return handlers;
}

/**
 * Export GET and POST handlers from Better Auth
 *
 * These handlers automatically process all Better Auth requests
 * based on the URL path and HTTP method.
 */
export async function GET(req: Request) {
  const { GET } = await getHandlers();
  return GET(req);
}

export async function POST(req: Request) {
  const { POST } = await getHandlers();
  return POST(req);
}

/**
 * Runtime configuration
 * Use Node.js runtime (not Edge) for database connections
 */
export const runtime = "nodejs";
