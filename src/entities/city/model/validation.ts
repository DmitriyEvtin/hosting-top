import { z } from "zod";

export const createCitySchema = z.object({
  name: z
    .string()
    .min(1, "Название города обязательно")
    .max(100, "Название города не должно превышать 100 символов")
    .trim(),
});

export const updateCitySchema = z.object({
  name: z
    .string()
    .min(1, "Название города обязательно")
    .max(100, "Название города не должно превышать 100 символов")
    .trim(),
});

export const citySearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type CitySearchInput = z.infer<typeof citySearchSchema>;
