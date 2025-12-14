/**
 * LoadingSpinner Component
 *
 * Reusable loading indicator with accessibility labels
 * Multiple sizes: small, medium, large
 * Used during API calls and async operations
 */

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = "medium",
  color = "blue",
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
  };

  const colorClasses = {
    blue: "border-blue-600 border-t-transparent",
    gray: "border-gray-600 border-t-transparent",
    white: "border-white border-t-transparent",
  };

  const spinnerClass = `${sizeClasses[size]} ${
    colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
  } rounded-full animate-spin`;

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className={spinnerClass}></div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
