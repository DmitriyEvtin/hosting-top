"use client";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { HostingBreadcrumbs } from "@/shared/ui/HostingBreadcrumbs";
import { HostingNavigation } from "@/shared/ui/HostingNavigation";
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
    testPeriod: number;
    contentBlocks: ContentBlock[];
  };
}

export function HostingOverviewPage({ hosting }: HostingOverviewPageProps) {
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

                  {hosting.testPeriod > 0 && (
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Контент-блоки отсутствуют</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {hosting.contentBlocks.map(block => (
              <Card
                key={block.id}
                className={cn(block.type && `content-block-type-${block.type}`)}
              >
                {block.title && (
                  <CardHeader>
                    <CardTitle>{block.title}</CardTitle>
                  </CardHeader>
                )}
                {block.content && (
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
