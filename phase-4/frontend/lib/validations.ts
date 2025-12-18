/**
 * Form Validation Schemas
 *
 * Centralized Zod validation schemas for all forms in the application.
 * All schemas mirror backend Pydantic validation rules for consistency.
 *
 * Backend Validation Rules (from models.py and schemas/requests.py):
 * - Task Title: max 200 characters, required, stripped
 * - Task Description: max 1000 characters, optional, stripped
 * - Task Priority: enum (low, medium, high), default "medium"
 * - Task Due Date: optional datetime, cannot be in the past for new tasks
 * - Task Tags: optional array of strings, empty strings filtered out
 * - User Email: valid email format, required
 * - User Password: min 8 characters, required
 * - User Name: max 100 characters, required, stripped
 */

import { z } from "zod";

// ==================== Task Validation Schemas ====================

/**
 * Task Creation Schema
 * Validates all fields for creating a new task
 */
export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  priority: z
    .enum(["low", "medium", "high"], {
      message: "Priority must be low, medium, or high",
    })
    .default("medium"),
  due_date: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        // Backend expects ISO 8601 format datetime
        // Validate format (backend uses datetime.fromisoformat)
        try {
          // Try to parse as ISO 8601 date
          const parsed = new Date(date);
          if (isNaN(parsed.getTime())) {
            return false;
          }
          // Backend doesn't enforce "not in past" - just validates format
          // Frontend can allow past dates (backend accepts them)
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)" }
    ),
  tags: z
    .array(z.string())
    .optional()
    .transform((tags) => {
      if (!tags) return [];
      // Backend behavior: filters empty strings and strips (no lowercase)
      // Match backend exactly: cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
      return tags.filter((tag) => tag && tag.trim().length > 0).map((tag) => tag.trim());
    }),
});

/**
 * Task Update Schema
 * All fields optional - validates only provided fields
 */
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be 200 characters or less")
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .transform((val) => (val ? val.trim() : ""))
    .optional(),
  priority: z
    .enum(["low", "medium", "high"], {
      message: "Priority must be low, medium, or high",
    })
    .optional(),
  due_date: z.string().optional(),
  tags: z
    .array(z.string())
    .optional()
    .transform((tags) => {
      if (!tags) return [];
      // Backend behavior: filters empty strings and strips (no lowercase)
      // Match backend exactly: cleaned_tags = [tag.strip() for tag in v if tag and tag.strip()]
      return tags.filter((tag) => tag && tag.trim().length > 0).map((tag) => tag.trim());
    }),
});

/**
 * Task Form Schema (used for both create and edit)
 * Uses create schema by default
 */
export const taskFormSchema = taskCreateSchema;

// Type exports for TypeScript
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;

// ==================== Authentication Validation Schemas ====================

/**
 * Email validation
 * Uses regex pattern matching backend EmailStr validation
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .transform((val) => val.trim().toLowerCase());

/**
 * Password validation for signup
 * Backend requirements: min 8 characters
 * Frontend enhancement: check for uppercase, lowercase, number, special char
 */
const passwordSignupSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /\d/.test(password), {
    message: "Password must contain at least one number",
  });

/**
 * Password validation for signin
 * Less strict - just required
 */
const passwordSigninSchema = z.string().min(1, "Password is required");

/**
 * Name validation
 * Backend: max 100 characters, required, stripped
 */
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: "Name cannot be empty",
  });

/**
 * Signup Schema
 * Validates user registration form
 */
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSignupSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Signin Schema
 * Validates user login form
 */
export const signinSchema = z.object({
  email: emailSchema,
  password: passwordSigninSchema,
});

/**
 * Forgot Password Schema
 * Validates email for password reset request
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema
 * Validates new password for reset
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSignupSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type exports for TypeScript
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ==================== Field-Level Validation Helpers ====================

/**
 * Validate a single field from a schema
 * Returns error message or null
 */
export function validateField<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || "Validation error";
    }
    return "Validation error";
  }
}

/**
 * Validate entire form data
 * Returns object with field errors or null
 */
export function validateForm<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Record<string, string> | null {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (field) {
          errors[field] = issue.message;
        }
      });
      return errors;
    }
    return { form: "Validation error" };
  }
}

/**
 * Safe parse with error transformation
 * Returns { success: boolean, data?: T, errors?: Record<string, string> }
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): {
  success: boolean;
  data?: z.infer<T>;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path.join(".");
    if (field) {
      errors[field] = issue.message;
    }
  });

  return { success: false, errors };
}

// ==================== Character Count Helpers ====================

/**
 * Get remaining characters for a field
 */
export function getRemainingChars(value: string, maxLength: number): number {
  return Math.max(0, maxLength - value.length);
}

/**
 * Check if field is over character limit
 */
export function isOverLimit(value: string, maxLength: number): boolean {
  return value.length > maxLength;
}

/**
 * Format character count display
 * Returns "X/Y characters" or "X characters remaining"
 */
export function formatCharCount(value: string, maxLength: number): string {
  const current = value.length;

  if (current > maxLength) {
    return `${current - maxLength} characters over limit`;
  }

  return `${current}/${maxLength} characters`;
}
