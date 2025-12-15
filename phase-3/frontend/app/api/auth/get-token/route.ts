/**
 * Custom JWT Token Generation Endpoint
 *
 * This endpoint generates a JWT token for the currently authenticated user.
 * The token is used for backend API authentication (FastAPI).
 *
 * Endpoint: POST /api/auth/get-token
 */

import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";
import { SignJWT } from "jose";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "No active session found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the secret key for signing JWT
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      console.error("BETTER_AUTH_SECRET is not set");
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "Server authentication configuration is invalid",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create JWT payload
    const payload = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      sessionId: session.session.id,
    };

    // Sign JWT token with same secret as backend
    // This ensures the backend can verify the token
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 days expiration
      .setSubject(session.user.id)
      .sign(new TextEncoder().encode(secret));

    // Return the token
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating JWT token:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
