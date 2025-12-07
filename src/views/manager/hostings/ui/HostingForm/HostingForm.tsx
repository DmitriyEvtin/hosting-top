"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/lib/use-toast";
import { generateSlug } from "@/shared/lib/slug-utils";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { ImageUpload } from "@/shared/ui/ImageUpload";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import { Textarea } from "@/shared/ui/Textarea";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

/**
 * Схема валидации для формы хостинга
 */
const hostingFormSchema = z.object({
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(200, "Название не должно превышать 200 символов"),
  description: z
    .string()
    .max(5000, "Описание не должно превышать 5000 символов")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .union([
      z.string().url("Некорректный URL логотипа"),
      z.literal(""),
    ])
    .optional(),
  websiteUrl: z
    .string()
    .url("Некорректный URL сайта")
    .min(1, "URL сайта обязателен"),
  isActive: z.boolean().default(true),
});

type HostingFormData = z.infer<typeof hostingFormSchema>;

/**
 * Интерфейс данных хостинга
 */
export interface HostingData {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
}

interface HostingFormProps {
  hosting?: HostingData;
  onSubmit: (data: HostingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Компонент формы создания/редактирования хостинга
 */
export function HostingForm({
  hosting,
  onSubmit,
  onCancel,
  isLoading = false,
}: HostingFormProps) {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    hosting?.logoUrl || null
  );
  const [slugPreview, setSlugPreview] = useState<string>(
    hosting?.slug || ""
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
  } = useForm<HostingFormData>({
    resolver: zodResolver(hostingFormSchema),
    defaultValues: {
      name: hosting?.name || "",
      description: hosting?.description || "",
      logoUrl: hosting?.logoUrl || "",
      websiteUrl: hosting?.websiteUrl || "",
      isActive: hosting?.isActive ?? true,
    },
    mode: "onChange",
  });

  const watchedName = watch("name");

  // Автоматическая генерация slug при изменении названия
  useEffect(() => {
    if (watchedName) {
      const generatedSlug = generateSlug(watchedName);
      setSlugPreview(generatedSlug);
    } else {
      setSlugPreview("");
    }
  }, [watchedName]);

  // Обработка успешной загрузки логотипа
  const handleLogoUploadComplete = (result: {
    image: { url: string };
  }) => {
    const logoUrl = result.image.url;
    setValue("logoUrl", logoUrl);
    setLogoPreview(logoUrl);
    toast({
      title: "Логотип загружен",
      description: "Логотип успешно загружен",
      variant: "success",
    });
  };

  // Обработка ошибки загрузки логотипа
  const handleLogoUploadError = (error: string) => {
    toast({
      title: "Ошибка загрузки",
      description: error,
      variant: "destructive",
    });
  };

  // Обработка удаления логотипа
  const handleLogoRemove = () => {
    setValue("logoUrl", "");
    setLogoPreview(null);
  };

  // Обработка отправки формы
  const onFormSubmit = async (data: HostingFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Произошла ошибка";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hosting ? "Редактирование хостинга" : "Создание хостинга"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Название */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Название <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Введите название хостинга"
              className={errors.name ? "border-red-500" : ""}
              disabled={isLoading || isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Slug (readonly, для информации) */}
          {slugPreview && (
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (автоматически)</Label>
              <Input
                id="slug"
                value={slugPreview}
                readOnly
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Slug будет автоматически сгенерирован из названия
              </p>
            </div>
          )}

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Введите описание хостинга"
              rows={5}
              className={errors.description ? "border-red-500" : ""}
              disabled={isLoading || isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Логотип */}
          <div className="space-y-2">
            <Label htmlFor="logo">Логотип</Label>
            <div className="space-y-4">
              {logoPreview && (
                <div className="relative inline-block">
                  <Image
                    src={logoPreview}
                    alt="Логотип"
                    width={96}
                    height={96}
                    className="h-24 w-24 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleLogoRemove}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    disabled={isLoading || isSubmitting}
                  >
                    ×
                  </Button>
                </div>
              )}
              <ImageUpload
                category="hosting-logos"
                maxFiles={1}
                generateThumbnails={false}
                onUploadComplete={handleLogoUploadComplete}
                onUploadError={handleLogoUploadError}
                className={logoPreview ? "hidden" : ""}
              />
            </div>
            {errors.logoUrl && (
              <p className="text-sm text-red-500">{errors.logoUrl.message}</p>
            )}
          </div>

          {/* Сайт */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">
              Сайт <span className="text-red-500">*</span>
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              {...register("websiteUrl")}
              placeholder="https://example.com"
              className={errors.websiteUrl ? "border-red-500" : ""}
              disabled={isLoading || isSubmitting}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500">
                {errors.websiteUrl.message}
              </p>
            )}
          </div>

          {/* Активен */}
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isLoading || isSubmitting}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Активен
                </Label>
              </div>
            )}
          />

          {/* Кнопки действий */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSubmitting || !isValid}
            >
              {isSubmitting || isLoading
                ? "Сохранение..."
                : hosting
                  ? "Сохранить изменения"
                  : "Создать хостинг"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

