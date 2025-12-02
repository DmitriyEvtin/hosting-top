import { AWS_CONFIG } from "@/shared/lib/aws-config";
import { z } from "zod";

/**
 * Валидация URL изображения из разрешенного S3 bucket
 */
const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);

    // Проверка CloudFront домена
    if (
      AWS_CONFIG.CLOUDFRONT_DOMAIN &&
      urlObj.hostname === AWS_CONFIG.CLOUDFRONT_DOMAIN
    ) {
      return true;
    }

    // Проверка MinIO endpoint для локальной разработки
    if (process.env.AWS_S3_ENDPOINT) {
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, "");
      if (urlObj.hostname === endpoint) {
        return true;
      }
    }

    // Проверка AWS S3 URL
    const s3Pattern = new RegExp(
      `^${AWS_CONFIG.S3_BUCKET}\\.s3\\.${AWS_CONFIG.REGION}\\.amazonaws\\.com$`
    );
    if (s3Pattern.test(urlObj.hostname)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Название категории обязательно")
    .max(200, "Название категории не должно превышать 200 символов")
    .trim(),
  siteIds: z
    .array(z.string().cuid("Некорректный формат CUID"))
    .min(1, "Необходимо указать хотя бы один сайт"),
  image: z
    .union([
      z
        .string()
        .url("URL изображения должен быть валидным")
        .refine(
          (url) => validateImageUrl(url),
          "URL изображения должен быть из разрешенного S3 bucket"
        ),
      z.null(),
    ])
    .optional(),
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
  image: z
    .union([
      z
        .string()
        .url("URL изображения должен быть валидным")
        .refine(
          (url) => validateImageUrl(url),
          "URL изображения должен быть из разрешенного S3 bucket"
        ),
      z.null(),
    ])
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

