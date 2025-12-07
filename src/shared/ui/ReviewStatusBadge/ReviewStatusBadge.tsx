import * as React from "react";
import { Badge } from "../Badge";
import { cn } from "@/shared/lib/utils";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: "На модерации",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  APPROVED: {
    label: "Одобрен",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  REJECTED: {
    label: "Отклонен",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

export function ReviewStatusBadge({
  status,
  className,
}: ReviewStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

