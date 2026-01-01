"use client";

/**
 * Reset Password Page
 *
 * Allows users to reset their password using email from URL
 * Features:
 * - Email from URL query parameter
 * - Password strength validation with Zod
 * - Password confirmation matching
 * - Field-level validation on blur
 * - Success/error message display
 * - Accessibility-compliant error display
 */

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { resetPasswordSchema, safeParse } from "@/lib/validations";
import LoadingSpinner from "@/components/LoadingSpinner";

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Check if email exists
  useEffect(() => {
    if (!email) {
      setApiError(t('email_missing'));
    }
  }, [email, t]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = validationTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const validateForm = (): boolean => {
    if (!email) {
      setApiError(t('email_missing'));
      return false;
    }

    // Use Zod schema for comprehensive validation (without token)
    const result = safeParse(resetPasswordSchema.omit({ token: true }), {
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

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
  const validateField = (fieldName: "password" | "confirmPassword") => {
    const value = formData[fieldName];

    // Create validation for specific field
    try {
      if (fieldName === "password") {
        resetPasswordSchema.shape.password.parse(value);
      } else if (fieldName === "confirmPassword") {
        // Validate confirm password matches
        if (value !== formData.password) {
          throw new Error("Passwords do not match");
        }
        resetPasswordSchema.shape.confirmPassword.parse(value);
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
    setSuccessMessage("");

    if (!email) {
      setApiError(t('email_missing'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to reset password by email
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          new_password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || data.message || "Failed to reset password. Please try again.";
        setApiError(errorMsg);
        return;
      }

      // Success - show message
      setSuccessMessage(t('password_reset_redirecting'));

      // Clear form
      setFormData({ password: "", confirmPassword: "" });

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: unknown) {
      // Extract error message from various error formats
      let errorMessage = t('reset_error');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
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
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage("");
    }

    // Clear previous timeout for this field
    if (validationTimeoutsRef.current[name]) {
      clearTimeout(validationTimeoutsRef.current[name]);
    }

    // Real-time validation: validate field after a short delay (debounced)
    // This provides immediate feedback without being too aggressive
    validationTimeoutsRef.current[name] = setTimeout(() => {
      validateField(name as "password" | "confirmPassword");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('reset_password_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {email ? t('reset_for_email', { email }) : t('reset_password_subtitle')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4" role="alert">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ms-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Error Message */}
          {apiError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4" role="alert">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ms-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {apiError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('new_password')} <span className="text-red-500" aria-label="required">*</span>
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
                placeholder={t('new_password_placeholder')}
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('password_requirements')}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('confirm_new_password')} <span className="text-red-500" aria-label="required">*</span>
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
                placeholder={t('confirm_new_password_placeholder')}
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                  <span className="inline-block">⚠</span>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ms-2">{t('resetting')}</span>
                </span>
              ) : (
                t('reset_button')
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 block"
            >
              {t('back_to_signin')}
            </Link>
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 block text-sm"
            >
              {t('request_new_link')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner size="large" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

