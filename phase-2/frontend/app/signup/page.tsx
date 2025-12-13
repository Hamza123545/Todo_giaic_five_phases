"use client";

/**
 * Signup Page
 *
 * User registration page with comprehensive validation
 * Features:
 * - Email format validation with Zod
 * - Password strength requirements (8+ chars, uppercase, lowercase, number)
 * - Real-time password strength indicator
 * - Confirm password matching
 * - Field-level validation on blur
 * - Clear error messages with accessibility
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { getPasswordStrength } from "@/lib/utils";
import { signupSchema, safeParse } from "@/lib/validations";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const validateForm = (): boolean => {
    // Use Zod schema for comprehensive validation
    const result = safeParse(signupSchema, formData);

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
  const validateField = (fieldName: "name" | "email" | "password" | "confirmPassword") => {
    const value = formData[fieldName];

    // Create validation for specific field
    try {
      if (fieldName === "name") {
        signupSchema.shape.name.parse(value);
      } else if (fieldName === "email") {
        signupSchema.shape.email.parse(value);
      } else if (fieldName === "password") {
        signupSchema.shape.password.parse(value);
      } else if (fieldName === "confirmPassword") {
        // Validate confirm password matches
        if (value !== formData.password) {
          throw new Error("Passwords do not match");
        }
      }

      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error: unknown) {
      // Set error if validation fails
      let errorMessage = "Invalid value";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        errorMessage = zodError.errors[0]?.message || "Invalid value";
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
      // Use Better Auth signup
      const result = await authClient.signUp.email({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
      });

      if (result.error) {
        setApiError(result.error.message || "Signup failed. Please try again.");
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
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred during signup";
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
      validateField(name as "name" | "email" | "password" | "confirmPassword");
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

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start managing your tasks today
          </p>
        </div>

        {/* Signup Form */}
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

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={() => validateField("name")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.name
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="John Doe"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.name}
                </p>
              )}
            </div>

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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
                aria-describedby={errors.password ? "password-error" : "password-requirements"}
              />
              {errors.password ? (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.password}
                </p>
              ) : formData.password.length > 0 ? (
                <p
                  id="password-requirements"
                  className={`mt-1 text-sm flex items-center gap-1 ${
                    passwordStrength.strength === "strong"
                      ? "text-green-600 dark:text-green-400"
                      : passwordStrength.strength === "medium"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {passwordStrength.strength === "strong" ? (
                    <span className="inline-block">✓</span>
                  ) : (
                    <span className="inline-block">⚠</span>
                  )}
                  {passwordStrength.message}
                </p>
              ) : (
                <p id="password-requirements" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => validateField("confirmPassword")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.confirmPassword
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="••••••••"
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              />
              {errors.confirmPassword ? (
                <p id="confirm-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.confirmPassword}
                </p>
              ) : formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password ? (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="inline-block">✓</span>
                  Passwords match
                </p>
              ) : null}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="white" label="Creating account..." />
              ) : (
                "Sign up"
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
