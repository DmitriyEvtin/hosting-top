import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Название товара обязательно")
    .max(200, "Название товара не должно превышать 200 символов")
    .trim(),
  categoryId: z
    .string()
    .cuid("Некорректный формат CUID")
    .optional(),
  siteIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы один сайт"),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Название товара обязательно")
    .max(200, "Название товара не должно превышать 200 символов")
    .trim()
    .optional(),
  categoryId: z
    .string()
    .cuid("Некорректный формат CUID")
    .nullable()
    .optional(),
  siteIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы один сайт")
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createProductImagesSchema = z.object({
  imageUrls: z
    .array(z.string().url("Некорректный формат URL"))
    .min(1, "Необходимо указать хотя бы одно изображение"),
});

export const reorderProductImagesSchema = z.object({
  imageIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы одно изображение"),
});

export type CreateProductImagesInput = z.infer<typeof createProductImagesSchema>;
export type ReorderProductImagesInput = z.infer<typeof reorderProductImagesSchema>;

