"use client";

import React, { useState, useEffect } from "react";
import { ReviewCard } from "@/shared/ui/ReviewCard";
import { Button } from "@/shared/ui/Button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface AllReviewsPageProps {
  initialData: {
    reviews: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function AllReviewsPage({ initialData }: AllReviewsPageProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState(initialData.reviews);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [sort, setSort] = useState<"date" | "helpful" | "rating">("date");
  const [loading, setLoading] = useState(false);
  const [helpfulMarks, setHelpfulMarks] = useState<Set<string>>(new Set());

  // Загрузить отметки полезности из localStorage
  useEffect(() => {
    const stored = localStorage.getItem("helpfulReviews");
    if (stored) {
      try {
        setHelpfulMarks(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error("Ошибка загрузки отметок из localStorage:", error);
      }
    }
  }, []);

  const fetchReviews = async (page: number, sortBy: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/public/reviews?page=${page}&sort=${sortBy}`
      );
      if (!response.ok) {
        throw new Error("Ошибка загрузки отзывов");
      }
      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Ошибка загрузки отзывов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: "date" | "helpful" | "rating") => {
    setSort(newSort);
    fetchReviews(1, newSort);
  };

  const handlePageChange = (page: number) => {
    fetchReviews(page, sort);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (helpfulMarks.has(reviewId)) return;

    try {
      // Генерируем fingerprint для неавторизованных пользователей
      let fingerprint: string | undefined;
      if (!session?.user?.id) {
        // Используем существующий fingerprint из localStorage или создаем новый
        const storedFingerprint = localStorage.getItem("userFingerprint");
        if (storedFingerprint) {
          fingerprint = storedFingerprint;
        } else {
          fingerprint = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          localStorage.setItem("userFingerprint", fingerprint);
        }
      }

      const response = await fetch(`/api/public/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      });

      if (response.ok) {
        const data = await response.json();

        // Обновить отметку
        const newMarks = new Set(helpfulMarks);
        newMarks.add(reviewId);
        setHelpfulMarks(newMarks);
        localStorage.setItem("helpfulReviews", JSON.stringify([...newMarks]));

        // Обновить счетчик в UI
        setReviews(
          reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Ошибка отметки полезности:", errorData.error);
      }
    } catch (error) {
      console.error("Ошибка отметки полезности:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Все отзывы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Отзывы пользователей о хостинг-провайдерах
          </p>
        </div>

        {/* Сортировка */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={sort === "date" ? "default" : "outline"}
            onClick={() => handleSortChange("date")}
            disabled={loading}
          >
            По дате
          </Button>
          <Button
            variant={sort === "helpful" ? "default" : "outline"}
            onClick={() => handleSortChange("helpful")}
            disabled={loading}
          >
            По полезности
          </Button>
          <Button
            variant={sort === "rating" ? "default" : "outline"}
            onClick={() => handleSortChange("rating")}
            disabled={loading}
          >
            По рейтингу
          </Button>
        </div>

        {/* Список отзывов */}
        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Пока нет отзывов
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="relative">
                {/* Ссылка на хостинг */}
                {review.hosting && (
                  <Link
                    href={`/hosting/${review.hosting.slug}`}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {review.hosting.logoUrl && (
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={review.hosting.logoUrl}
                          alt={review.hosting.name}
                          fill
                          className="object-contain"
                          sizes="24px"
                        />
                      </div>
                    )}
                    <span className="font-medium">{review.hosting.name}</span>
                  </Link>
                )}
                <ReviewCard
                  review={review}
                  isAuthor={session?.user?.id === review.user.id}
                  onMarkHelpful={() => handleMarkHelpful(review.id)}
                  isMarkedHelpful={helpfulMarks.has(review.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              Назад
            </Button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Вперед
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

