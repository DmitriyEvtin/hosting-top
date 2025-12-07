import * as React from "react";
import { useState } from "react";
import { Card } from "../Card";
import { Button } from "../Button";
import { Textarea } from "../Textarea";
import { RatingStars } from "../RatingStars";
import { cn } from "@/shared/lib/utils";

export interface ReviewFormData {
  content: string;
  performanceRating: number;
  supportRating: number;
  priceQualityRating: number;
  reliabilityRating: number;
  easeOfUseRating: number;
}

export interface ReviewFormProps {
  hostingName: string;
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function ReviewForm({
  hostingName,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    content: initialData?.content || "",
    performanceRating: initialData?.performanceRating || 0,
    supportRating: initialData?.supportRating || 0,
    priceQualityRating: initialData?.priceQualityRating || 0,
    reliabilityRating: initialData?.reliabilityRating || 0,
    easeOfUseRating: initialData?.easeOfUseRating || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.content.length < 50) {
      newErrors.content = "Отзыв должен содержать минимум 50 символов";
    } else if (formData.content.length > 2000) {
      newErrors.content = "Отзыв не может быть длиннее 2000 символов";
    }

    const ratings = [
      formData.performanceRating,
      formData.supportRating,
      formData.priceQualityRating,
      formData.reliabilityRating,
      formData.easeOfUseRating,
    ];

    if (ratings.some((r) => r === 0)) {
      newErrors.ratings = "Пожалуйста, оцените все критерии";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  const isFormValid =
    formData.content.length >= 50 &&
    formData.content.length <= 2000 &&
    formData.performanceRating > 0 &&
    formData.supportRating > 0 &&
    formData.priceQualityRating > 0 &&
    formData.reliabilityRating > 0 &&
    formData.easeOfUseRating > 0;

  return (
    <Card className={cn("p-6", className)}>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Оставить отзыв о {hostingName}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Текст отзыва */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ваш отзыв *
          </label>
          <Textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Поделитесь своим опытом использования хостинга..."
            rows={6}
            variant={errors.content ? "error" : "default"}
            className="resize-none"
          />
          <div className="flex justify-between mt-1 flex-wrap gap-2">
            <span
              className={cn(
                "text-sm",
                errors.content
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {errors.content || `${formData.content.length}/2000 символов`}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Минимум 50 символов
            </span>
          </div>
        </div>

        {/* Оценки */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Оцените по критериям *
          </h3>

          <RatingStars
            rating={formData.performanceRating}
            onChange={(rating) =>
              setFormData({ ...formData, performanceRating: rating })
            }
            label="Производительность"
            interactive
          />

          <RatingStars
            rating={formData.supportRating}
            onChange={(rating) =>
              setFormData({ ...formData, supportRating: rating })
            }
            label="Поддержка"
            interactive
          />

          <RatingStars
            rating={formData.priceQualityRating}
            onChange={(rating) =>
              setFormData({ ...formData, priceQualityRating: rating })
            }
            label="Цена/качество"
            interactive
          />

          <RatingStars
            rating={formData.reliabilityRating}
            onChange={(rating) =>
              setFormData({ ...formData, reliabilityRating: rating })
            }
            label="Надежность"
            interactive
          />

          <RatingStars
            rating={formData.easeOfUseRating}
            onChange={(rating) =>
              setFormData({ ...formData, easeOfUseRating: rating })
            }
            label="Простота использования"
            interactive
          />

          {errors.ratings && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {errors.ratings}
            </p>
          )}
        </div>

        {/* Информационное сообщение */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Ваш отзыв будет опубликован после проверки модератором
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 flex-wrap">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 min-w-[200px]"
          >
            {isSubmitting ? "Отправка..." : "Опубликовать отзыв"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

