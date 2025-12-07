"use client";

import React, { useState } from "react";
import { ReviewForm, ReviewFormData } from "@/shared/ui/ReviewForm";
import { Button } from "@/shared/ui/Button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/lib/use-toast";

interface CreateReviewSectionProps {
  hostingId: string;
  hostingName: string;
  hostingSlug: string;
}

export function CreateReviewSection({
  hostingId,
  hostingName,
  hostingSlug,
}: CreateReviewSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "loading") {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  if (!session) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Войдите, чтобы оставить отзыв о {hostingName}
        </p>
        <Button onClick={() => router.push("/auth/signin")}>
          Войти
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
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
        throw new Error(result.error || "Ошибка отправки отзыва");
      }

      toast({
        title: "Отзыв отправлен",
        description: "Ваш отзыв будет опубликован после проверки модератором",
        variant: "success",
      });

      setShowForm(false);
      
      // Перенаправить на страницу отзывов
      router.push(`/hosting/${hostingSlug}/reviews`);
      router.refresh();
    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);
      
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отправить отзыв",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Поделитесь своим опытом
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Помогите другим пользователям сделать правильный выбор
        </p>
        <Button onClick={() => setShowForm(true)}>
          Оставить отзыв
        </Button>
      </div>
    );
  }

  return (
    <ReviewForm
      hostingName={hostingName}
      onSubmit={handleSubmit}
      onCancel={() => setShowForm(false)}
      isSubmitting={isSubmitting}
    />
  );
}

