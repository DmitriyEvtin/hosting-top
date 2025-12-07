"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/Table";
import { Button } from "@/shared/ui/Button";
import { ReviewStatusBadge } from "@/shared/ui/ReviewStatusBadge";
import { RatingStars } from "@/shared/ui/RatingStars";
import Image from "next/image";

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

interface ReviewModerationTableProps {
  reviews: Review[];
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
  onView: (review: Review) => void;
}

export function ReviewModerationTable({
  reviews,
  onApprove,
  onReject,
  onView,
}: ReviewModerationTableProps) {
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Нет отзывов для отображения</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Автор</TableHead>
            <TableHead>Провайдер</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Рейтинг</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {review.user.name || "Пользователь"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.user.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {review.hosting.logoUrl && (
                    <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={review.hosting.logoUrl}
                        alt={review.hosting.name}
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </div>
                  )}
                  <span>{review.hosting.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {calculateAverage(review).toFixed(1)}
                  </span>
                  <RatingStars
                    rating={Math.round(calculateAverage(review))}
                    size="sm"
                  />
                </div>
              </TableCell>
              <TableCell>
                <ReviewStatusBadge status={review.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView(review)}
                  >
                    Просмотр
                  </Button>
                  {review.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onApprove(review.id)}
                      >
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(review.id)}
                      >
                        Отклонить
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

