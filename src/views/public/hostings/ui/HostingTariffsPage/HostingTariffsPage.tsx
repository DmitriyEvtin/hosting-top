"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HostingBreadcrumbs } from "@/shared/ui/HostingBreadcrumbs";
import { HostingNavigation } from "@/shared/ui/HostingNavigation";
import { TariffCard } from "@/shared/ui/TariffCard";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/shared/ui/Card";

interface ReferenceItem {
  id: string;
  name: string;
  slug: string;
}

interface HostingTariffsPageProps {
  hosting: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
  tariffs: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    link: string | null;
    priceMonth: number | string | null;
    priceYear: number | string | null;
    currency: string;
    diskSpace: number | null;
    traffic: number | null;
    domains: number | null;
    sites: number | null;
    countDb: number | null;
    ftpAccounts: number | null;
    mailboxes: number | null;
    ssl: boolean | null;
    backup: boolean | null;
    ssh: boolean | null;
    automaticCms: boolean | null;
    ddosDef: boolean | null;
    antivirus: boolean | null;
    countTestDays: number | null;
    cms: ReferenceItem[];
    controlPanels: ReferenceItem[];
    countries: ReferenceItem[];
    dataStores: ReferenceItem[];
    operationSystems: ReferenceItem[];
    programmingLanguages: ReferenceItem[];
  }>;
}

export function HostingTariffsPage({
  hosting,
  tariffs,
}: HostingTariffsPageProps) {
  const breadcrumbsItems = [
    { label: "Главная", href: "/" },
    { label: "Хостинги", href: "/hosting" },
    { label: hosting.name, href: `/hosting/${hosting.slug}` },
    { label: "Тарифы" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Хлебные крошки */}
        <HostingBreadcrumbs items={breadcrumbsItems} />

        {/* Навигация */}
        <HostingNavigation
          hostingSlug={hosting.slug}
          currentPage="tariffs"
        />

        {/* Шапка с краткой информацией о хостинге */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Логотип */}
              {hosting.logoUrl && (
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 bg-white rounded-lg border p-4 flex items-center justify-center overflow-hidden">
                    <Image
                      src={hosting.logoUrl}
                      alt={`Логотип ${hosting.name}`}
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                </div>
              )}

              {/* Информация о хостинге */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{hosting.name}</h1>
                <p className="text-muted-foreground mb-4">
                  Тарифы хостинга
                </p>

                {/* Ссылка на официальный сайт */}
                {hosting.websiteUrl && (
                  <Link
                    href={hosting.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <span>Официальный сайт</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Сетка тарифов */}
        {tariffs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                Тарифы отсутствуют
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tariffs.map((tariff) => (
              <TariffCard key={tariff.id} tariff={tariff} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

