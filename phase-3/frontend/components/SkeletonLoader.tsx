"use client";

import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export default function SkeletonLoader({ className, count = 1 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
        />
      ))}
    </div>
  );
}
