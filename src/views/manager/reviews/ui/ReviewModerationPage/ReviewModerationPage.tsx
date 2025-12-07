"use client";

import React, { useState, useEffect } from "react";
import { ReviewModerationTable } from "../ReviewModerationTable";
import { RejectReviewModal } from "../RejectReviewModal";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/Tabs";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/lib/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { RatingStars } from "@/shared/ui/RatingStars";
import { ReviewStatusBadge } from "@/shared/ui/ReviewStatusBadge";
import Image from "next/image";

type ReviewStatus = "pending" | "approved" | "rejected" | "all";

interface Review {
  id: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  performanceRating: number;
  supportRating: number;
  priceQualityRating: number;
  reliabilityRating: number;
  easeOfUseRating: number;
  createdAt: string;
  rejectionReason?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  hosting: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function ReviewModerationPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<ReviewsResponse["pagination"]>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [rejectingReviewId, setRejectingReviewId] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  const fetchReviews = async (
    page: number = 1,
    statusFilter: ReviewStatus = status
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/manager/reviews?status=${statusFilter}&page=${page}&limit=20`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка загрузки отзывов");
      }

      const data: ReviewsResponse = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Ошибка загрузки отзывов:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось загрузить отзывы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/manager/reviews/${reviewId}/approve`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка одобрения отзыва");
      }

      toast({
        title: "Отзыв одобрен",
        description: "Отзыв успешно опубликован",
        variant: "success",
      });

      fetchReviews(pagination.page, status);
    } catch (error) {
      console.error("Ошибка одобрения:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось одобрить отзыв",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingReviewId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/manager/reviews/${rejectingReviewId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка отклонения отзыва");
      }

      toast({
        title: "Отзыв отклонен",
        description: "Пользователь получит уведомление с причиной",
        variant: "success",
      });

      setRejectingReviewId(null);
      fetchReviews(pagination.page, status);
    } catch (error) {
      console.error("Ошибка отклонения:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось отклонить отзыв",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAverage = (review: Review) => {
    return (
      (review.performanceRating +
        review.supportRating +
        review.priceQualityRating +
        review.reliabilityRating +
        review.easeOfUseRating) /
      5
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Модерация отзывов</h1>
        <p className="mt-2 text-gray-600">
          Просмотр, одобрение и отклонение отзывов пользователей
        </p>
      </div>

      {/* Табы фильтрации */}
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as ReviewStatus);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
      >
        <TabsList>
          <TabsTrigger value="pending">На модерации</TabsTrigger>
          <TabsTrigger value="approved">Одобренные</TabsTrigger>
          <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
          <TabsTrigger value="all">Все</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Таблица отзывов */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-500">Загрузка...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Нет отзывов с выбранным статусом
          </div>
        ) : (
          <>
            <ReviewModerationTable
              reviews={reviews}
              onApprove={handleApprove}
              onReject={(id) => setRejectingReviewId(id)}
              onView={setViewingReview}
            />

            {/* Пагинация */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => fetchReviews(pagination.page - 1, status)}
                  disabled={pagination.page === 1 || loading}
                >
                  Назад
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Страница {pagination.page} из {pagination.pages} (
                  {pagination.total} всего)
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchReviews(pagination.page + 1, status)}
                  disabled={pagination.page === pagination.pages || loading}
                >
                  Вперед
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно отклонения */}
      <RejectReviewModal
        isOpen={!!rejectingReviewId}
        onClose={() => setRejectingReviewId(null)}
        onConfirm={handleReject}
        isSubmitting={isSubmitting}
      />

      {/* Модальное окно просмотра отзыва */}
      <Dialog open={!!viewingReview} onOpenChange={() => setViewingReview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали отзыва</DialogTitle>
            <DialogDescription>
              Полная информация об отзыве пользователя
            </DialogDescription>
          </DialogHeader>

          {viewingReview && (
            <div className="space-y-6 py-4">
              {/* Автор */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Автор
                </h3>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">
                      {viewingReview.user.name || "Пользователь"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {viewingReview.user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Провайдер */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Провайдер
                </h3>
                <div className="flex items-center gap-3">
                  {viewingReview.hosting.logoUrl && (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={viewingReview.hosting.logoUrl}
                        alt={viewingReview.hosting.name}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <span className="font-medium">{viewingReview.hosting.name}</span>
                </div>
              </div>

              {/* Дата и статус */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Дата создания
                  </h3>
                  <div>
                    {new Date(viewingReview.createdAt).toLocaleDateString(
                      "ru-RU",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Статус
                  </h3>
                  <ReviewStatusBadge status={viewingReview.status} />
                </div>
              </div>

              {/* Рейтинг */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Общий рейтинг
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {calculateAverage(viewingReview).toFixed(1)}
                  </span>
                  <RatingStars
                    rating={Math.round(calculateAverage(viewingReview))}
                    size="lg"
                  />
                </div>
              </div>

              {/* Детальные рейтинги */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Детальные оценки
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Производительность</span>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={viewingReview.performanceRating}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {viewingReview.performanceRating}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Поддержка</span>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={viewingReview.supportRating}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {viewingReview.supportRating}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Цена/Качество</span>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={viewingReview.priceQualityRating}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {viewingReview.priceQualityRating}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Надежность</span>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={viewingReview.reliabilityRating}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {viewingReview.reliabilityRating}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Удобство использования</span>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={viewingReview.easeOfUseRating}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {viewingReview.easeOfUseRating}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Текст отзыва */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Текст отзыва
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{viewingReview.content}</p>
                </div>
              </div>

              {/* Причина отклонения */}
              {viewingReview.rejectionReason && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Причина отклонения
                  </h3>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">
                      {viewingReview.rejectionReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

