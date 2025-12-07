"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HostingBreadcrumbsProps {
  hostingId: string;
  currentPage: "edit" | "content" | "tariffs";
  hostingName?: string;
}

interface Hosting {
  id: string;
  name: string;
}

const pageLabels: Record<"edit" | "content" | "tariffs", string> = {
  edit: "Редактирование",
  content: "Контент",
  tariffs: "Тарифы",
};

export function HostingBreadcrumbs({
  hostingId,
  currentPage,
  hostingName,
}: HostingBreadcrumbsProps) {
  const [hosting, setHosting] = useState<Hosting | null>(
    hostingName ? { id: hostingId, name: hostingName } : null
  );
  const [loading, setLoading] = useState(!hostingName);

  useEffect(() => {
    if (hostingName) {
      setHosting({ id: hostingId, name: hostingName });
      setLoading(false);
      return;
    }

    const fetchHosting = async () => {
      try {
        const response = await fetch(`/api/manager/hostings/${hostingId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ошибка загрузки хостинга");
        }

        setHosting(data.hosting);
      } catch (err) {
        console.error("Ошибка загрузки хостинга для хлебных крошек:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHosting();
  }, [hostingId, hostingName]);

  if (loading) {
    return (
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/manager/hostings" className="hover:text-gray-900">
          Хостинги
        </Link>
        <span>/</span>
        <span className="text-gray-500">Загрузка...</span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600">
      <Link href="/manager/hostings" className="hover:text-gray-900">
        Хостинги
      </Link>
      <span>/</span>
      {hosting && (
        <>
          <Link
            href={`/manager/hostings/${hosting.id}/edit`}
            className="hover:text-gray-900"
          >
            {hosting.name}
          </Link>
          <span>/</span>
        </>
      )}
      <span className="text-gray-900 font-medium">
        {pageLabels[currentPage]}
      </span>
    </nav>
  );
}

