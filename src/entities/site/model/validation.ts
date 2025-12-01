import { z } from "zod";

export const createSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Название сайта обязательно")
    .max(100, "Название сайта не должно превышать 100 символов")
    .trim(),
});

export const updateSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Название сайта обязательно")
    .max(100, "Название сайта не должно превышать 100 символов")
    .trim()
    .optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

