"use client";

import React, { useState, useEffect } from "react";
import { ReviewCard } from "@/shared/ui/ReviewCard";
import { RatingStars } from "@/shared/ui/RatingStars";
import { Button } from "@/shared/ui/Button";
import { useSession } from "next-auth/react";
import { HostingBreadcrumbs } from "@/shared/ui/HostingBreadcrumbs";
import { HostingNavigation } from "@/shared/ui/HostingNavigation";
import { EditReviewModal } from "@/views/public/reviews/ui/EditReviewModal";

interface HostingReviewsPageProps {
  hostingSlug: string;
  hostingName: string;
  initialData: {
    reviews: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    hostingRating: {
      average: number;
      count: number;
      criteria: {
        performance: number;
        support: number;
        priceQuality: number;
        reliability: number;
        easeOfUse: number;
      };
    };
  };
}

export function HostingReviewsPage({
  hostingSlug,
  hostingName,
  initialData,
}: HostingReviewsPageProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState(initialData.reviews);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [hostingRating, setHostingRating] = useState(initialData.hostingRating);
  const [sort, setSort] = useState<"date" | "helpful" | "rating">("date");
  const [loading, setLoading] = useState(false);
  const [helpfulMarks, setHelpfulMarks] = useState<Set<string>>(new Set());
  const [editingReview, setEditingReview] = useState<any>(null);

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
        `/api/public/hostings/${hostingSlug}/reviews?page=${page}&sort=${sortBy}`
      );
      if (!response.ok) {
        throw new Error("Ошибка загрузки отзывов");
      }
      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
      setHostingRating(data.hostingRating);
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

  const breadcrumbsItems = [
    { label: "Главная", href: "/" },
    { label: "Хостинги", href: "/hosting" },
    { label: hostingName, href: `/hosting/${hostingSlug}` },
    { label: "Отзывы" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Хлебные крошки */}
        <HostingBreadcrumbs items={breadcrumbsItems} />

        {/* Навигация */}
        <HostingNavigation hostingSlug={hostingSlug} currentPage="reviews" />

        {/* Заголовок и рейтинг */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Отзывы о {hostingName}</h1>

          {hostingRating.count > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  {hostingRating.average.toFixed(1)}
                </div>
                <div>
                  <RatingStars
                    rating={Math.round(hostingRating.average)}
                    size="lg"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    На основе {hostingRating.count}{" "}
                    {hostingRating.count === 1
                      ? "отзыва"
                      : hostingRating.count < 5
                        ? "отзывов"
                        : "отзывов"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Производительность
                  </span>
                  <RatingStars
                    rating={Math.round(hostingRating.criteria.performance)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Поддержка
                  </span>
                  <RatingStars
                    rating={Math.round(hostingRating.criteria.support)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Цена/качество
                  </span>
                  <RatingStars
                    rating={Math.round(hostingRating.criteria.priceQuality)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Надежность
                  </span>
                  <RatingStars
                    rating={Math.round(hostingRating.criteria.reliability)}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Простота
                  </span>
                  <RatingStars
                    rating={Math.round(hostingRating.criteria.easeOfUse)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}
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
            Пока нет отзывов об этом хостинге
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAuthor={session?.user?.id === review.user.id}
                onEdit={() => setEditingReview(review)}
                onMarkHelpful={() => handleMarkHelpful(review.id)}
                isMarkedHelpful={helpfulMarks.has(review.id)}
              />
            ))}
          </div>
        )}

        {/* Модальное окно редактирования */}
        {editingReview && (
          <EditReviewModal
            review={editingReview}
            hostingName={hostingName}
            onClose={() => setEditingReview(null)}
          />
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

