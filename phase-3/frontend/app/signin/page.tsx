"use client";

/**
 * Signin Page
 *
 * User login page with comprehensive validation
 * Features:
 * - Email format validation with Zod
 * - Password required validation
 * - Field-level validation on blur
 * - Clear error messages from backend (401, 400)
 * - Accessibility-compliant error display
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { signinSchema, safeParse } from "@/lib/validations";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const validateForm = (): boolean => {
    // Use Zod schema for comprehensive validation
    const result = safeParse(signinSchema, formData);

    if (!result.success && result.errors) {
      setErrors(result.errors);

      // Focus first invalid field for accessibility
      const firstErrorField = Object.keys(result.errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }

      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Validate a single field on blur
   * Provides immediate feedback as user completes each field
   */
  const validateField = (fieldName: "email" | "password") => {
    const value = formData[fieldName];

    // Create validation for specific field
    try {
      if (fieldName === "email") {
        signinSchema.shape.email.parse(value);
      } else if (fieldName === "password") {
        signinSchema.shape.password.parse(value);
      }

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error: unknown) {
      // Set error if validation fails - extract just the message
      let errorMessage = "Invalid value";
      
      // Check if it's a ZodError
      if (error && typeof error === "object" && "issues" in error && Array.isArray((error as { issues: unknown[] }).issues)) {
        // Zod error - extract first issue message
        const zodError = error as { issues: Array<{ message?: string }> };
        errorMessage = zodError.issues[0]?.message || "Invalid value";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Handle serialized Zod error format
        if ("errors" in error && Array.isArray((error as { errors: unknown[] }).errors)) {
          const zodError = error as { errors: Array<{ message?: string }> };
          errorMessage = zodError.errors[0]?.message || "Invalid value";
        }
      }
      
      setErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use Better Auth signin
      const result = await authClient.signIn.email({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (result.error) {
        // Extract error message from Better Auth error response
        let errorMessage = "Invalid email or password";
        
        if (result.error.message) {
          errorMessage = result.error.message;
        } else if (Array.isArray(result.error)) {
          // Handle array format: [{ message: "...", ... }]
          const firstError = result.error[0];
          if (firstError && typeof firstError === "object" && "message" in firstError) {
            errorMessage = String(firstError.message);
          }
        } else if (typeof result.error === "object" && "message" in result.error) {
          errorMessage = String(result.error.message);
        }
        
        setApiError(errorMessage);
        return;
      }

      // Session is now established via Better Auth cookies
      // Token will be fetched fresh on each API call (same pattern as phase-2-web)

      // Store user data if needed
      if (result.data?.user) {
        sessionStorage.setItem("user", JSON.stringify(result.data.user));
      }

      // Redirect to dashboard or intended destination
      const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      router.push(redirectPath);
    } catch (error: unknown) {
      // Extract error message from various error formats
      let errorMessage = "An error occurred during sign in";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (Array.isArray(error)) {
        // Handle array format: [{ message: "...", ... }]
        const firstError = error[0];
        if (firstError && typeof firstError === "object" && "message" in firstError) {
          errorMessage = String(firstError.message);
        }
      } else if (error && typeof error === "object") {
        if ("message" in error) {
          errorMessage = String(error.message);
        } else if ("error" in error && typeof error.error === "object" && error.error !== null) {
          const errorObj = error.error as { message?: string };
          if (errorObj.message) {
            errorMessage = String(errorObj.message);
          }
        }
      }
      
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Real-time validation: clear error immediately when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear API error when user starts typing
    if (apiError) {
      setApiError("");
    }

    // Clear previous timeout for this field
    if (validationTimeoutsRef.current[name]) {
      clearTimeout(validationTimeoutsRef.current[name]);
    }

    // Real-time validation: validate field after a short delay (debounced)
    // This provides immediate feedback without being too aggressive
    validationTimeoutsRef.current[name] = setTimeout(() => {
      validateField(name as "email" | "password");
      delete validationTimeoutsRef.current[name];
    }, 500); // 500ms debounce
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = validationTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue managing your tasks
          </p>
        </div>

        {/* Signin Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg px-8 py-6 space-y-6">
            {/* API Error Message */}
            {apiError && (
              <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md"
                role="alert"
              >
                <p className="text-sm">{apiError}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={() => validateField("email")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.email
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="you@example.com"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password <span className="text-red-500" aria-label="required">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                onBlur={() => validateField("password")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.password
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="••••••••"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="white" label="Signing in..." />
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
