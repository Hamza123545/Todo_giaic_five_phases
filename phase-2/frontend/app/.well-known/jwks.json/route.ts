/**
 * JWKS Endpoint for Better Auth
 * 
 * This route serves the JSON Web Key Set (JWKS) for JWT verification.
 * Backend uses this endpoint to verify JWT tokens issued by Better Auth.
 * 
 * Path: /.well-known/jwks.json
 * 
 * Better Auth's JWT plugin stores keys in the database (jwks table).
 * This route queries the database and formats the response as JWKS.
 */

import { NextRequest } from "next/server";

/**
 * Get JWKS from database
 * Better Auth's JWT plugin stores public keys in the jwks table
 */
export async function GET(request: NextRequest) {
  try {
    // Proxy to Better Auth's handler which serves JWKS
    // Better Auth handler is at /api/auth/[...all]
    const url = new URL(request.url);
    const baseUrl = url.origin;
    
    // Create internal request to Better Auth's JWKS endpoint
    const authRequest = new Request(`${baseUrl}/api/auth/.well-known/jwks.json`, {
      method: "GET",
      headers: request.headers,
    });

    // Use Better Auth handler
    const { auth } = await import("@/lib/auth-server");
    const { toNextJsHandler } = await import("better-auth/next-js");
    const handlers = toNextJsHandler(auth.handler);
    
    const response = await handlers.GET(authRequest);
    
    // Return response with caching headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error) {
    console.error("JWKS endpoint error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch JWKS",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const runtime = "nodejs";

