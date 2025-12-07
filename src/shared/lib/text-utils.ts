/**
 * Удаляет HTML-теги из текста и возвращает чистый текст
 * @param html - HTML-строка
 * @returns Текст без HTML-тегов
 */
export function stripHtml(html: string): string {
  if (!html) {
    return "";
  }

  // Создаем временный элемент для парсинга HTML
  // В браузере используем DOMParser, в Node.js - простую замену
  if (typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || doc.body.innerText || "";
  }

  // Fallback для серверной стороны: простая замена тегов
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Удаляем скрипты
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Удаляем стили
    .replace(/<[^>]+>/g, "") // Удаляем все остальные теги
    .replace(/&nbsp;/g, " ") // Заменяем &nbsp; на пробел
    .replace(/&[a-z]+;/gi, "") // Удаляем HTML-сущности (можно расширить)
    .trim();
}

/**
 * Обрезает текст до указанной длины, стараясь не разрывать слова
 * @param text - Текст для обрезания
 * @param maxLength - Максимальная длина
 * @param suffix - Суффикс для обрезанного текста (по умолчанию "...")
 * @returns Обрезанный текст
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Обрезаем до максимальной длины
  let truncated = text.substring(0, maxLength);

  // Пытаемся найти последний пробел, чтобы не разорвать слово
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  // Если нашли пробел и он не слишком близко к началу, обрезаем по нему
  if (lastSpaceIndex > maxLength * 0.7) {
    truncated = truncated.substring(0, lastSpaceIndex);
  }

  return truncated.trim() + suffix;
}

/**
 * Обрезает HTML-текст до указанной длины, удаляя HTML-теги
 * @param html - HTML-строка
 * @param maxLength - Максимальная длина текста (без учета HTML-тегов)
 * @param suffix - Суффикс для обрезанного текста (по умолчанию "...")
 * @returns Обрезанный текст без HTML-тегов
 */
export function truncateHtml(
  html: string | null | undefined,
  maxLength: number,
  suffix: string = "..."
): string | null {
  if (!html) {
    return null;
  }

  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength, suffix);
}

