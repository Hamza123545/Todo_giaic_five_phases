/**
 * Better Auth Client Configuration
 *
 * Configures Better Auth with JWT plugin enabled
 * Handles session management and token issuance
 * Uses shared secret (BETTER_AUTH_SECRET) with backend
 */

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

/**
 * Better Auth Client Configuration
 *
 * This client is used throughout the frontend for authentication
 * Features:
 * - Email/password authentication
 * - JWT token generation for API calls
 * - Session management via cookies
 * - Client-side session storage
 */
// Auto-detect production URL from Vercel or use environment variable
const getBaseURL = (): string => {
  // Priority 1: Explicit environment variable
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Priority 2: Vercel's automatic URL (production)
  if (typeof process !== "undefined" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Priority 3: Browser-side: use current location
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Priority 4: Fallback to localhost for development
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),

  // Plugins (JWT client for token generation)
  plugins: [jwtClient()],
});

/**
 * Get current session from Better Auth
 */
export async function getSession() {
  try {
    const session = await authClient.getSession();
    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    const response = await authClient.signUp.email({
      email,
      password,
      name,
    });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Signup failed";
    throw new Error(errorMessage);
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  try {
    const response = await authClient.signIn.email({
      email,
      password,
    });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Signin failed";
    throw new Error(errorMessage);
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await authClient.signOut();

    // Clear auth token from sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_token");
    }
  } catch (error) {
    console.error("Signout error:", error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.data?.user !== null && session.data?.user !== undefined;
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.data?.user || null;
}

/**
 * Refresh session token
 */
export async function refreshSession() {
  try {
    const session = await authClient.getSession();
    return session;
  } catch (error) {
    console.error("Failed to refresh session:", error);
    return null;
  }
}

/**
 * Note: Password reset is now handled directly via backend API
 * See: /app/forgot-password and /app/reset-password pages
 * These functions are kept for backward compatibility but not used
 */

// Export token getter function (same pattern as phase-2-web)
export const getToken = authClient.token;

// Export the auth client as default
export default authClient;
