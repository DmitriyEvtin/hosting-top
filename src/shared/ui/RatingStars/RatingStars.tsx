import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  label,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            disabled={!interactive}
            className={cn(
              sizeClasses[size],
              interactive &&
                "cursor-pointer hover:scale-110 transition-transform disabled:cursor-default"
            )}
            aria-label={`Оценка ${value} из ${maxRating}`}
          >
            <svg
              className={cn(
                "w-full h-full transition-colors",
                value <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 dark:text-gray-600 fill-current"
              )}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      {interactive && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {rating}/5
        </span>
      )}
    </div>
  );
}

