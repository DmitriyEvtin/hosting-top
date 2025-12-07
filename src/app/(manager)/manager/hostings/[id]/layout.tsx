"use client";

import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface HostingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }> | { id: string };
}

export default function HostingLayout({ children, params }: HostingLayoutProps) {
  const pathname = usePathname();
  const [resolvedParams, setResolvedParams] = React.useState<{ id: string } | null>(null);

  React.useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params;
        setResolvedParams(resolved);
      } else {
        setResolvedParams(params);
      }
    };
    resolveParams();
  }, [params]);

  if (!resolvedParams) {
    return <div>Загрузка...</div>;
  }

  const hostingId = resolvedParams.id;
  const basePath = `/manager/hostings/${hostingId}`;

  // Определяем активный таб на основе текущего пути
  const isEditActive = pathname === `${basePath}/edit`;
  const isTariffsActive = pathname === `${basePath}/tariffs`;
  const isContentActive = pathname === `${basePath}/content`;

  const tabClass = (isActive: boolean) =>
    cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-6">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        <Link
          href={`${basePath}/edit`}
          className={tabClass(isEditActive)}
        >
          Редактирование
        </Link>
        <Link
          href={`${basePath}/tariffs`}
          className={tabClass(isTariffsActive)}
        >
          Тарифы
        </Link>
        <Link
          href={`${basePath}/content`}
          className={tabClass(isContentActive)}
        >
          Контент
        </Link>
      </div>
      <div>{children}</div>
    </div>
  );
}

