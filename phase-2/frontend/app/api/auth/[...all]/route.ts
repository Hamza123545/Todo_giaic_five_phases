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
    try {
      // Dynamic import to avoid build-time execution
      const { auth } = await import("@/lib/auth-server");
      handlers = toNextJsHandler(auth.handler);
    } catch (error) {
      console.error("Failed to initialize Better Auth handlers:", error);
      throw error;
    }
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
  try {
    const handlers = await getHandlers();
    const response = await handlers.GET(req);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Better Auth GET handler error:", {
      message: errorMessage,
      stack: errorStack,
      url: req.url,
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Log request details for debugging
    const url = new URL(req.url);
    console.log("Better Auth POST request:", {
      path: url.pathname,
      hasBody: !!req.body,
    });
    
    const handlers = await getHandlers();
    const response = await handlers.POST(req);
    
    // Log response status
    console.log("Better Auth POST response status:", response.status);
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Better Auth POST handler error:", {
      message: errorMessage,
      stack: errorStack,
      url: req.url,
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Runtime configuration
 * Use Node.js runtime (not Edge) for database connections
 */
export const runtime = "nodejs";
