/**
 * Image Migrator Service
 * Сервис для миграции изображений хостингов с внешнего сервера в AWS S3
 */

import axios from "axios";
import chalk from "chalk";
import sharp from "sharp";
import { s3Service } from "../../src/shared/lib/s3-utils";

/**
 * Поддерживаемые форматы изображений
 */
const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"] as const;
type ImageFormat = (typeof SUPPORTED_FORMATS)[number];

/**
 * Размеры thumbnails для генерации
 */
const THUMBNAIL_SIZES = [100, 200, 400] as const;

/**
 * Максимальное количество попыток при ошибках
 */
const MAX_RETRIES = 3;

/**
 * Задержка между попытками (в миллисекундах)
 */
const RETRY_DELAY = 2000;

/**
 * Timeout для скачивания изображений (в миллисекундах)
 */
const DOWNLOAD_TIMEOUT = 30000;

/**
 * Определяет формат изображения из буфера с помощью Sharp
 */
async function detectImageFormatFromBuffer(
  buffer: Buffer
): Promise<ImageFormat | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    const format = metadata.format;

    if (!format) {
      return null;
    }

    // Преобразуем формат Sharp в наш формат
    const formatMap: Record<string, ImageFormat> = {
      jpeg: "jpg",
      jpg: "jpg",
      png: "png",
      gif: "gif",
      webp: "webp",
    };

    return formatMap[format] || null;
  } catch {
    return null;
  }
}

/**
 * Определяет формат изображения по MIME типу или расширению
 */
function detectImageFormat(
  contentType?: string,
  url?: string
): ImageFormat | null {
  // Определение по Content-Type
  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (normalized.includes("jpeg") || normalized.includes("jpg")) {
      return "jpg";
    }
    if (normalized.includes("png")) {
      return "png";
    }
    if (normalized.includes("gif")) {
      return "gif";
    }
    if (normalized.includes("webp")) {
      return "webp";
    }
  }

  // Определение по расширению в URL
  if (url) {
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension && SUPPORTED_FORMATS.includes(extension as ImageFormat)) {
      return extension as ImageFormat;
    }
  }

  return null;
}

/**
 * Получает MIME type по формату изображения
 */
function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[format];
}

/**
 * Результат скачивания изображения
 */
interface DownloadResult {
  buffer: Buffer;
  contentType?: string;
}

/**
 * Скачивает изображение по URL
 */
export async function downloadImage(url: string): Promise<DownloadResult> {
  try {
    console.log(chalk.blue(`📥 Скачивание изображения: ${url}`));

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: DOWNLOAD_TIMEOUT,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] as string | undefined;

    if (buffer.length === 0) {
      throw new Error("Получен пустой файл");
    }

    console.log(
      chalk.green(
        `✓ Изображение скачано: ${(buffer.length / 1024).toFixed(2)} KB${
          contentType ? ` (${contentType})` : ""
        }`
      )
    );

    return { buffer, contentType };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error(`Timeout при скачивании изображения: ${url}`);
      }
      if (error.response) {
        throw new Error(
          `Ошибка HTTP ${error.response.status}: ${error.response.statusText}`
        );
      }
      throw new Error(`Ошибка сети при скачивании: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Загружает логотип хостинга в S3
 */
export async function uploadHostingLogo(
  imageBuffer: Buffer,
  hostingSlug: string,
  format: ImageFormat
): Promise<string> {
  try {
    const key = `images/hosting-logos/${hostingSlug}.${format}`;
    const contentType = getMimeType(format);

    console.log(chalk.blue(`📤 Загрузка логотипа в S3: ${key}`));

    const result = await s3Service.uploadFile(key, imageBuffer, {
      contentType,
      metadata: {
        "hosting-slug": hostingSlug,
        "upload-timestamp": new Date().toISOString(),
      },
      cacheControl: "public, max-age=31536000, immutable",
      acl: "public-read",
    });

    console.log(chalk.green(`✓ Логотип загружен: ${result.url}`));

    return result.url;
  } catch (error) {
    throw new Error(`Ошибка загрузки логотипа в S3: ${error}`);
  }
}

/**
 * Генерирует и загружает thumbnails изображения
 */
export async function generateAndUploadThumbnails(
  imageBuffer: Buffer,
  hostingSlug: string,
  format: ImageFormat
): Promise<string[]> {
  const thumbnailUrls: string[] = [];

  try {
    console.log(
      chalk.blue(
        `🖼️  Генерация thumbnails для: ${hostingSlug} (${THUMBNAIL_SIZES.join(", ")}px)`
      )
    );

    // Конвертируем изображение в формат, поддерживаемый Sharp
    // Sharp может работать с большинством форматов, но для консистентности конвертируем в PNG или JPEG
    const outputFormat =
      format === "gif" ? "png" : format === "webp" ? "webp" : "jpeg";
    const outputMimeType =
      outputFormat === "png"
        ? "image/png"
        : outputFormat === "webp"
          ? "image/webp"
          : "image/jpeg";

    for (const size of THUMBNAIL_SIZES) {
      try {
        // Генерируем thumbnail с помощью Sharp
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(size, size, {
            fit: "cover",
            position: "center",
          })
          .toFormat(
            outputFormat === "jpeg"
              ? "jpeg"
              : outputFormat === "png"
                ? "png"
                : "webp",
            {
              quality: 85,
            }
          )
          .toBuffer();

        const thumbnailKey = `images/hosting-logos/thumbnails/${size}x${size}/${hostingSlug}.${outputFormat}`;

        console.log(
          chalk.blue(`  📤 Загрузка thumbnail ${size}x${size}: ${thumbnailKey}`)
        );

        const result = await s3Service.uploadFile(
          thumbnailKey,
          thumbnailBuffer,
          {
            contentType: outputMimeType,
            metadata: {
              "hosting-slug": hostingSlug,
              "thumbnail-size": `${size}x${size}`,
              "upload-timestamp": new Date().toISOString(),
            },
            cacheControl: "public, max-age=31536000, immutable",
            acl: "public-read",
          }
        );

        thumbnailUrls.push(result.url);
        console.log(
          chalk.green(`  ✓ Thumbnail ${size}x${size} загружен: ${result.url}`)
        );
      } catch (error) {
        console.error(
          chalk.red(`  ✗ Ошибка создания thumbnail ${size}x${size}: ${error}`)
        );
        // Продолжаем с другими размерами
      }
    }

    console.log(
      chalk.green(
        `✓ Создано thumbnails: ${thumbnailUrls.length}/${THUMBNAIL_SIZES.length}`
      )
    );

    return thumbnailUrls;
  } catch (error) {
    throw new Error(`Ошибка генерации thumbnails: ${error}`);
  }
}

/**
 * Создает placeholder изображение для хостинга
 */
export async function createPlaceholderImage(
  hostingSlug: string
): Promise<string> {
  try {
    console.log(chalk.blue(`🎨 Создание placeholder для: ${hostingSlug}`));

    // Получаем первую букву названия для placeholder
    const firstLetter = hostingSlug.charAt(0).toUpperCase();

    // Создаем простое изображение с помощью Sharp
    const size = 400;
    const backgroundColor = "#e5e7eb"; // Серый фон
    const textColor = "#6b7280"; // Серый текст

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="${size * 0.4}"
          font-weight="bold"
          fill="${textColor}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${firstLetter}</text>
      </svg>
    `;

    // Конвертируем SVG в PNG
    const imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    const key = `images/hosting-logos/${hostingSlug}.png`;

    console.log(chalk.blue(`📤 Загрузка placeholder в S3: ${key}`));

    const result = await s3Service.uploadFile(key, imageBuffer, {
      contentType: "image/png",
      metadata: {
        "hosting-slug": hostingSlug,
        "is-placeholder": "true",
        "upload-timestamp": new Date().toISOString(),
      },
      cacheControl: "public, max-age=31536000, immutable",
      acl: "public-read",
    });

    console.log(chalk.green(`✓ Placeholder создан: ${result.url}`));

    return result.url;
  } catch (error) {
    throw new Error(`Ошибка создания placeholder: ${error}`);
  }
}

/**
 * Главная функция миграции изображения хостинга
 * Скачивает изображение, загружает в S3 и создает thumbnails
 */
export async function migrateHostingImage(
  oldImageUrl: string,
  hostingSlug: string
): Promise<string> {
  let lastError: Error | null = null;

  // Retry логика
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        chalk.yellow(
          `\n🔄 Попытка ${attempt}/${MAX_RETRIES}: Миграция изображения для ${hostingSlug}`
        )
      );

      // Скачиваем изображение
      const { buffer: imageBuffer, contentType } =
        await downloadImage(oldImageUrl);

      // Определяем формат изображения
      // Сначала пытаемся определить из буфера (наиболее надежно)
      let format =
        (await detectImageFormatFromBuffer(imageBuffer)) ||
        detectImageFormat(contentType, oldImageUrl) ||
        "jpg";

      // Нормализуем формат (jpeg -> jpg)
      if (format === "jpeg") {
        format = "jpg";
      }

      if (!SUPPORTED_FORMATS.includes(format as ImageFormat)) {
        throw new Error(`Неподдерживаемый формат изображения: ${format}`);
      }

      // Загружаем оригинальное изображение
      const imageUrl = await uploadHostingLogo(
        imageBuffer,
        hostingSlug,
        format as ImageFormat
      );

      // Генерируем и загружаем thumbnails
      await generateAndUploadThumbnails(
        imageBuffer,
        hostingSlug,
        format as ImageFormat
      );

      console.log(
        chalk.green(
          `\n✅ Успешно мигрировано изображение для ${hostingSlug}: ${imageUrl}`
        )
      );

      return imageUrl;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        chalk.red(
          `\n❌ Ошибка на попытке ${attempt}/${MAX_RETRIES}: ${lastError.message}`
        )
      );

      // Если это не последняя попытка, ждем перед повтором
      if (attempt < MAX_RETRIES) {
        console.log(
          chalk.yellow(
            `⏳ Ожидание ${RETRY_DELAY}ms перед следующей попыткой...`
          )
        );
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  // Если все попытки провалились, создаем placeholder
  console.log(
    chalk.yellow(
      `\n⚠️  Все попытки миграции провалились. Создание placeholder для ${hostingSlug}...`
    )
  );

  try {
    const placeholderUrl = await createPlaceholderImage(hostingSlug);
    console.log(
      chalk.green(
        `\n✅ Placeholder создан для ${hostingSlug}: ${placeholderUrl}`
      )
    );
    return placeholderUrl;
  } catch (error) {
    const placeholderError =
      error instanceof Error ? error : new Error(String(error));
    throw new Error(
      `Не удалось мигрировать изображение и создать placeholder: ${lastError?.message}. Placeholder ошибка: ${placeholderError.message}`
    );
  }
}
