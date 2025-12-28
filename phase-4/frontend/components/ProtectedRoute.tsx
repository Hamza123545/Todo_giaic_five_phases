"use client";

/**
 * ProtectedRoute Component
 *
 * Wrapper for authenticated pages
 * Checks authentication status
 * Redirects to login if not authenticated
 * Shows loading state during auth check
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check auth status
        const authenticated = await isAuthenticated();

        if (!authenticated) {
          // Clear any stale tokens
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("user");
          }

          // Store the intended destination for redirect after login
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
          if (currentPath !== "/signin" && currentPath !== "/signup") {
            sessionStorage.setItem("redirectAfterLogin", currentPath);
          }

          router.push("/signin");
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // On error, only redirect if not already on auth pages
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath !== "/signin" && currentPath !== "/signup") {
          router.push("/signin");
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Don't render children if not authorized
  if (!isAuthorized) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
