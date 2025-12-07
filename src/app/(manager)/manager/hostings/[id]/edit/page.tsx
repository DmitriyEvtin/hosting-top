"use client";

import { useToast } from "@/shared/lib/use-toast";
import { HostingBreadcrumbs } from "@/shared/ui/HostingBreadcrumbs";
import { HostingForm, HostingData } from "@/views/manager/hostings/ui/HostingForm";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EditHostingPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function EditHostingPage({ params }: EditHostingPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hosting, setHosting] = useState<HostingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Разрешаем params если это Promise
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
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

  // Загрузка данных хостинга
  useEffect(() => {
    const fetchHosting = async () => {
      if (!resolvedParams) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/manager/hostings/${resolvedParams.id}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка загрузки хостинга");
        }

        const data = await response.json();
        setHosting(data.hosting);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка загрузки хостинга";
        setError(errorMessage);
        toast({
          title: "Ошибка загрузки",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHosting();
  }, [resolvedParams, toast]);

  const handleSubmit = async (data: {
    name: string;
    description?: string;
    logoUrl?: string;
    websiteUrl: string;
    isActive: boolean;
  }) => {
    if (!resolvedParams) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/manager/hostings/${resolvedParams.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || null,
            logoUrl: data.logoUrl || null,
            websiteUrl: data.websiteUrl,
            isActive: data.isActive,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка обновления хостинга");
      }

      toast({
        title: "Хостинг обновлен",
        description: `Хостинг "${data.name}" успешно обновлен`,
        variant: "success",
      });

      // Редирект на список хостингов
      router.push("/manager/hostings");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка обновления хостинга";
      toast({
        title: "Ошибка обновления",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/manager/hostings");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {resolvedParams && (
          <HostingBreadcrumbs
            hostingId={resolvedParams.id}
            currentPage="edit"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Редактирование хостинга
          </h1>
          <p className="mt-2 text-gray-600">Загрузка данных...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error || !hosting) {
    return (
      <div className="space-y-6">
        {resolvedParams && (
          <HostingBreadcrumbs
            hostingId={resolvedParams.id}
            currentPage="edit"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Редактирование хостинга
          </h1>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">
            {error || "Хостинг не найден"}
          </p>
          <button
            onClick={() => router.push("/manager/hostings")}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Вернуться к списку хостингов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {resolvedParams && (
        <HostingBreadcrumbs
          hostingId={resolvedParams.id}
          currentPage="edit"
          hostingName={hosting.name}
        />
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Редактирование хостинга
        </h1>
        <p className="mt-2 text-gray-600">
          Внесите изменения в данные хостинга
        </p>
      </div>

      <HostingForm
        hosting={hosting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  );
}

