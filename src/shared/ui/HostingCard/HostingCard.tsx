"use client";

import { truncateHtml } from "@/shared/lib/text-utils";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";
import { RatingStars } from "@/shared/ui/RatingStars";
import { Calendar, Clock, ExternalLink, Package, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HostingCardProps {
  hosting: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    startYear: string | null;
    clients: number | null;
    testPeriod: number;
    _count: { tariffs: number };
    averageRating?: number | null;
    reviewCount?: number;
  };
  className?: string;
}

export function HostingCard({ hosting, className }: HostingCardProps) {
  const router = useRouter();
  const truncatedDescription = truncateHtml(hosting.description, 150);

  const handleCardClick = () => {
    router.push(`/hosting/${hosting.slug}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          {hosting.logoUrl ? (
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
              <Image
                src={hosting.logoUrl}
                alt={hosting.name}
                fill
                className="object-contain p-2"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-200 border flex items-center justify-center">
              <span className="text-gray-400 text-xs">Нет логотипа</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2">{hosting.name}</CardTitle>
            {hosting.websiteUrl && (
              <a
                href={hosting.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="truncate">
                  {hosting.websiteUrl.replace(/^https?:\/\//, "")}
                </span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {truncatedDescription && (
          <CardDescription className="mb-4 line-clamp-3">
            {truncatedDescription}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {hosting.startYear && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Основан в {hosting.startYear}</span>
            </div>
          )}
          {hosting.clients !== null && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{hosting.clients.toLocaleString("ru-RU")} клиентов</span>
            </div>
          )}
          {hosting.testPeriod > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{hosting.testPeriod} дн. тест</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4 border-t">
        {/* Рейтинг и отзывы */}
        {hosting.averageRating !== null &&
        hosting.averageRating !== undefined &&
        hosting.reviewCount !== undefined &&
        hosting.reviewCount > 0 ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {hosting.averageRating.toFixed(1)}
              </span>
              <RatingStars
                rating={Math.round(hosting.averageRating)}
                size="sm"
              />
            </div>
            <Link
              href={`/hosting/${hosting.slug}/reviews`}
              onClick={e => e.stopPropagation()}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Отзывы ({hosting.reviewCount})
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <Link
              href={`/hosting/${hosting.slug}/reviews`}
              onClick={e => e.stopPropagation()}
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              Станьте первым, кто оставит отзыв →
            </Link>
          </div>
        )}

        {/* Тарифы и кнопка */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              {hosting._count.tariffs}{" "}
              {hosting._count.tariffs === 1
                ? "тариф"
                : hosting._count.tariffs < 5
                  ? "тарифа"
                  : "тарифов"}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Подробнее
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
