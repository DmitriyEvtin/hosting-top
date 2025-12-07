"use client";

import { useToast } from "@/shared/lib/use-toast";
import { HostingForm } from "@/views/manager/hostings/ui/HostingForm";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewHostingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    description?: string;
    logoUrl?: string;
    websiteUrl: string;
    isActive: boolean;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/manager/hostings", {
        method: "POST",
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
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка создания хостинга");
      }

      toast({
        title: "Хостинг создан",
        description: `Хостинг "${data.name}" успешно создан`,
        variant: "success",
      });

      // Редирект на список хостингов
      router.push("/manager/hostings");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка создания хостинга";
      toast({
        title: "Ошибка создания",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/manager/hostings");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Создание хостинга</h1>
        <p className="mt-2 text-gray-600">
          Заполните форму для создания нового хостинга
        </p>
      </div>

      <HostingForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}

