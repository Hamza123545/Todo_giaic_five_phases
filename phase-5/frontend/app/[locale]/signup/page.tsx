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
import { useTranslations } from 'next-intl';
import { authClient } from "@/lib/auth";
import { getPasswordStrength, cn } from "@/lib/utils";
import { signupSchema, safeParse } from "@/lib/validations";
import { GlassCard } from "@/components/atoms/GlassCard";
import { Button } from "@/components/atoms/Button";

export default function SignupPage() {
  const t = useTranslations('auth');
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
      // Use Better Auth signup
      const result = await authClient.signUp.email({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
      });

      if (result.error) {
        // Extract error message from Better Auth error response
        let errorMessage = "Signup failed. Please try again.";
        
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
      let errorMessage = "An error occurred during signup";
      
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">{t('create_account_title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('start_managing')}
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <GlassCard variant="elevated" className="p-8 space-y-6">
            {/* API Error Message */}
            {apiError && (
              <div
                className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm"
                role="alert"
              >
                <p className="text-sm">{apiError}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('full_name')} <span className="text-red-500" aria-label="required">*</span>
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
                className={cn(
                  "w-full px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-200",
                  "bg-white/10 dark:bg-gray-800/10 border-white/30 dark:border-gray-700/50",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  errors.name
                    ? "border-red-500/50 dark:border-red-400/50 focus:ring-red-500/50"
                    : ""
                )}
                placeholder={t('name_placeholder')}
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
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('email_address')} <span className="text-red-500" aria-label="required">*</span>
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
                className={cn(
                  "w-full px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-200",
                  "bg-white/10 dark:bg-gray-800/10 border-white/30 dark:border-gray-700/50",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  errors.email
                    ? "border-red-500/50 dark:border-red-400/50 focus:ring-red-500/50"
                    : ""
                )}
                placeholder={t('email_placeholder')}
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
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('password')} <span className="text-red-500" aria-label="required">*</span>
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
                className={cn(
                  "w-full px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-200",
                  "bg-white/10 dark:bg-gray-800/10 border-white/30 dark:border-gray-700/50",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  errors.password
                    ? "border-red-500/50 dark:border-red-400/50 focus:ring-red-500/50"
                    : ""
                )}
                placeholder={t('password_placeholder')}
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
                <p id="password-requirements" className="mt-1 text-xs text-muted-foreground">
                  {t('password_requirements')}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('confirm_password')} <span className="text-red-500" aria-label="required">*</span>
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
                className={cn(
                  "w-full px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-200",
                  "bg-white/10 dark:bg-gray-800/10 border-white/30 dark:border-gray-700/50",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  errors.confirmPassword
                    ? "border-red-500/50 dark:border-red-400/50 focus:ring-red-500/50"
                    : ""
                )}
                placeholder={t('password_placeholder')}
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
                  {t('passwords_match')}
                </p>
              ) : null}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
              variant="primary"
            >
              {isLoading ? t('signing_up') : t('sign_up')}
            </Button>
          </GlassCard>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            {t('have_account')}{" "}
            <Link
              href="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              {t('sign_in')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
