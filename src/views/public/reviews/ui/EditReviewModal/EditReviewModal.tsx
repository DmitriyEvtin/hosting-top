"use client";

import React, { useState } from "react";
import { ReviewForm } from "@/shared/ui/ReviewForm";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/lib/use-toast";

interface EditReviewModalProps {
  review: {
    id: string;
    hostingId?: string;
    hosting?: {
      id: string;
    };
    content: string;
    performanceRating: number;
    supportRating: number;
    priceQualityRating: number;
    reliabilityRating: number;
    easeOfUseRating: number;
  };
  hostingName: string;
  onClose: () => void;
}

export function EditReviewModal({
  review,
  hostingName,
  onClose,
}: EditReviewModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Получить hostingId из review (может быть напрямую или через hosting.id)
      const hostingId = review.hostingId || review.hosting?.id;
      
      if (!hostingId) {
        throw new Error("Не удалось определить ID хостинга");
      }

      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostingId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка обновления отзыва");
      }

      toast({
        title: "Отзыв обновлен",
        description: "Ваш отзыв отправлен на повторную модерацию",
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Ошибка обновления отзыва:", error);
      
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить отзыв",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <ReviewForm
            hostingName={hostingName}
            initialData={{
              content: review.content,
              performanceRating: review.performanceRating,
              supportRating: review.supportRating,
              priceQualityRating: review.priceQualityRating,
              reliabilityRating: review.reliabilityRating,
              easeOfUseRating: review.easeOfUseRating,
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

