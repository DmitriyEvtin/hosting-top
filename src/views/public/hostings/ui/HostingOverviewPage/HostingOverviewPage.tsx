"use client";

import { getContentBlockHeader } from "@/shared/lib/content-block-types";
import { cn } from "@/shared/lib/utils";
import { Card, CardHeader } from "@/shared/ui/Card";
import { HostingBreadcrumbs } from "@/shared/ui/HostingBreadcrumbs";
import { HostingNavigation } from "@/shared/ui/HostingNavigation";
import { RatingStars } from "@/shared/ui/RatingStars";
import { CreateReviewSection } from "@/views/public/reviews/ui/CreateReviewSection";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ContentBlock {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  type: string | null;
}

interface HostingRating {
  average: number;
  count: number;
  criteria: {
    performance: number;
    support: number;
    priceQuality: number;
    reliability: number;
    easeOfUse: number;
  };
}

interface HostingOverviewPageProps {
  hosting: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    startYear: string | null;
    clients: number | null;
    testPeriod: number | null;
    contentBlocks: ContentBlock[];
  };
  hostingRating: HostingRating;
}

export function HostingOverviewPage({
  hosting,
  hostingRating,
}: HostingOverviewPageProps) {
  const breadcrumbsItems = [
    { label: "Главная", href: "/" },
    { label: "Хостинги", href: "/hosting" },
    { label: hosting.name },
  ];

  const formatNumber = (num: number | null): string => {
    if (num === null) return "—";
    return new Intl.NumberFormat("ru-RU").format(num);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Хлебные крошки */}
        <HostingBreadcrumbs items={breadcrumbsItems} />

        {/* Навигация */}
        <HostingNavigation hostingSlug={hosting.slug} currentPage="overview" />

        {/* Шапка с информацией о хостинге */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Логотип */}
              {hosting.logoUrl && (
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 bg-white rounded-lg border p-4 flex items-center justify-center overflow-hidden">
                    <Image
                      src={hosting.logoUrl}
                      alt={`Логотип ${hosting.name}`}
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                </div>
              )}

              {/* Информация о хостинге */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{hosting.name}</h1>
                  {/*hosting.description && (
                    <div
                      className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: hosting.description }}
                    />
                  )*/}

                  {/* Рейтинг хостинга */}
                  {hostingRating.count > 0 ? (
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                          {hostingRating.average.toFixed(1)}
                        </span>
                        <div>
                          <RatingStars
                            rating={Math.round(hostingRating.average)}
                            size="lg"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            На основе {hostingRating.count}{" "}
                            {hostingRating.count === 1
                              ? "отзыва"
                              : hostingRating.count < 5
                                ? "отзывов"
                                : "отзывов"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/hosting/${hosting.slug}/reviews`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                      >
                        Смотреть все отзывы →
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        У этого провайдера пока нет отзывов
                      </p>
                      <Link
                        href={`/hosting/${hosting.slug}/reviews`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                      >
                        Оставить первый отзыв →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Дополнительная информация */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  {hosting.startYear && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Год основания
                      </p>
                      <p className="text-lg font-semibold">
                        {hosting.startYear}
                      </p>
                    </div>
                  )}

                  {hosting.clients !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Количество клиентов
                      </p>
                      <p className="text-lg font-semibold">
                        {formatNumber(hosting.clients)}
                      </p>
                    </div>
                  )}

                  {hosting.testPeriod !== null && hosting.testPeriod > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Тестовый период
                      </p>
                      <p className="text-lg font-semibold">
                        {hosting.testPeriod}{" "}
                        {hosting.testPeriod === 1
                          ? "день"
                          : hosting.testPeriod < 5
                            ? "дня"
                            : "дней"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ссылка на официальный сайт */}
                {hosting.websiteUrl && (
                  <div className="pt-4">
                    <Link
                      href={hosting.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <span>Официальный сайт</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Контент-блоки */}
        {hosting.contentBlocks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Контент-блоки отсутствуют</p>
          </div>
        ) : (
          <div className="space-y-8">
            {hosting.contentBlocks.map(block => {
              // Автоматически генерируем заголовок на основе типа, если title отсутствует
              const blockTitle =
                block.title || getContentBlockHeader(block.type, hosting.name);

              return (
                <section
                  key={block.id}
                  className={cn(
                    block.type && `content-block-type-${block.type}`
                  )}
                >
                  {blockTitle && (
                    <h2 className="text-2xl font-bold mb-4">{blockTitle}</h2>
                  )}
                  {block.content && (
                    <div
                      className="prose prose-lg max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Секция создания отзыва */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Отзывы пользователей</h2>
          <CreateReviewSection
            hostingId={hosting.id}
            hostingName={hosting.name}
            hostingSlug={hosting.slug}
          />
        </div>
      </div>
    </div>
  );
}
