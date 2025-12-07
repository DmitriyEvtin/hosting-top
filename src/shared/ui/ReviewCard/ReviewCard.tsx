import * as React from "react";
import { Card } from "../Card";
import { RatingStars } from "../RatingStars";
import { ReviewStatusBadge } from "../ReviewStatusBadge";
import { Button } from "../Button";
import { cn } from "@/shared/lib/utils";

export interface ReviewCardProps {
  review: {
    id: string;
    content: string;
    performanceRating: number;
    supportRating: number;
    priceQualityRating: number;
    reliabilityRating: number;
    easeOfUseRating: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    helpfulCount: number;
    createdAt: string;
    user: {
      name: string | null;
      image: string | null;
    };
  };
  isAuthor?: boolean;
  onEdit?: () => void;
  onMarkHelpful?: () => void;
  isMarkedHelpful?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  isAuthor = false,
  onEdit,
  onMarkHelpful,
  isMarkedHelpful = false,
  className,
}: ReviewCardProps) {
  const averageRating =
    (review.performanceRating +
      review.supportRating +
      review.priceQualityRating +
      review.reliabilityRating +
      review.easeOfUseRating) /
    5;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Сегодня";
    if (diffInDays === 1) return "Вчера";
    if (diffInDays < 7) return `${diffInDays} дня назад`;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <Card className={cn("p-6", className)}>
      {/* Шапка */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            {review.user.image ? (
              <img
                src={review.user.image}
                alt={review.user.name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {(review.user.name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {review.user.name || "Пользователь"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAuthor && <ReviewStatusBadge status={review.status} />}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {averageRating.toFixed(1)}
            </div>
            <RatingStars rating={Math.round(averageRating)} size="sm" />
          </div>
        </div>
      </div>

      {/* Оценки по критериям */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <RatingStars
          rating={review.performanceRating}
          label="Производительность"
          size="sm"
        />
        <RatingStars
          rating={review.supportRating}
          label="Поддержка"
          size="sm"
        />
        <RatingStars
          rating={review.priceQualityRating}
          label="Цена/качество"
          size="sm"
        />
        <RatingStars
          rating={review.reliabilityRating}
          label="Надежность"
          size="sm"
        />
        <RatingStars
          rating={review.easeOfUseRating}
          label="Простота"
          size="sm"
        />
      </div>

      {/* Текст отзыва */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
        {review.content}
      </p>

      {/* Футер */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkHelpful}
            disabled={isMarkedHelpful}
          >
            <span className="mr-1">👍</span>
            Полезно ({review.helpfulCount})
          </Button>
        </div>
        {isAuthor && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Редактировать
          </Button>
        )}
      </div>
    </Card>
  );
}

