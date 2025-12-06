/**
 * Утилиты для генерации URL-friendly slug из русских названий
 * Транслитерация выполняется по стандарту ГОСТ 7.79-2000
 */

/**
 * Карта транслитерации русских букв в латиницу по ГОСТ 7.79-2000
 */
const TRANSLITERATION_MAP: Record<string, string> = {
  // Строчные буквы
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Заглавные буквы
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "J",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "Kh",
  Ц: "Ts",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Shch",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "Yu",
  Я: "Ya",
};

/**
 * Транслитерирует русский текст в латиницу по ГОСТ 7.79-2000
 * @param text - Текст для транслитерации
 * @returns Транслитерированный текст
 */
export function transliterate(text: string): string {
  if (!text) {
    return "";
  }

  return text
    .split("")
    .map((char) => TRANSLITERATION_MAP[char] ?? char)
    .join("");
}

/**
 * Генерирует URL-friendly slug из текста
 * @param text - Исходный текст
 * @param maxLength - Максимальная длина slug (по умолчанию 100)
 * @returns Сгенерированный slug
 */
export function generateSlug(text: string, maxLength: number = 100): string {
  if (!text) {
    return "";
  }

  // Транслитерация
  let slug = transliterate(text);

  // Приведение к нижнему регистру
  slug = slug.toLowerCase();

  // Замена пробелов и специальных символов на дефисы
  // Разрешаем только буквы, цифры и дефисы
  slug = slug.replace(/[^\w\s-]/g, "");

  // Замена пробелов и подчеркиваний на дефисы
  slug = slug.replace(/[\s_]+/g, "-");

  // Удаление повторяющихся дефисов
  slug = slug.replace(/-+/g, "-");

  // Удаление дефисов в начале и конце
  slug = slug.replace(/^-+|-+$/g, "");

  // Обрезка до максимальной длины
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Удаляем дефис в конце, если он остался после обрезки
    slug = slug.replace(/-+$/, "");
  }

  return slug;
}

/**
 * Обеспечивает уникальность slug, добавляя числовой суффикс при необходимости
 * @param slug - Базовый slug
 * @param existingSlugs - Массив существующих slug
 * @returns Уникальный slug
 */
export function ensureUniqueSlug(
  slug: string,
  existingSlugs: string[],
): string {
  if (!slug) {
    return "";
  }

  if (!existingSlugs || existingSlugs.length === 0) {
    return slug;
  }

  // Если slug уникален, возвращаем его
  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  // Проверяем существующие slug с суффиксами
  const slugPattern = new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`);
  const existingCounters: Set<number> = new Set();

  for (const existingSlug of existingSlugs) {
    if (existingSlug === slug) {
      existingCounters.add(1);
    } else {
      const match = existingSlug.match(slugPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) {
          existingCounters.add(num);
        }
      }
    }
  }

  // Находим первое свободное число, начиная с 2
  let counter = 2;
  while (existingCounters.has(counter)) {
    counter++;
  }

  return `${slug}-${counter}`;
}

