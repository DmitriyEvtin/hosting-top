import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Название категории обязательно")
    .max(200, "Название категории не должно превышать 200 символов")
    .trim(),
  siteIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы один сайт"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Название категории обязательно")
    .max(200, "Название категории не должно превышать 200 символов")
    .trim()
    .optional(),
  siteIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы один сайт")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

