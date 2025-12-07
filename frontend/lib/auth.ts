/**
 * Better Auth Configuration
 *
 * Configures Better Auth with JWT plugin enabled
 * Handles session management and token issuance
 * Uses shared secret (BETTER_AUTH_SECRET) with backend
 */

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client Configuration
 *
 * This client is used throughout the frontend for authentication
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",

  // Session configuration
  session: {
    cookieName: "better-auth.session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  // Storage configuration (for client-side token management)
  storage: typeof window !== "undefined" ? sessionStorage : undefined,
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
  } catch (error: any) {
    throw new Error(error.message || "Signup failed");
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
  } catch (error: any) {
    throw new Error(error.message || "Signin failed");
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

// Export the auth client as default
export default authClient;
