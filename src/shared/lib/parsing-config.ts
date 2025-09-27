/**
 * Конфигурация парсинга
 * Настройки для парсинга данных с bvb-alyans.ru
 */

import { env } from "./env";

// Основные настройки парсинга
export const parsingConfig = {
  // URL сайта для парсинга
  baseUrl: "https://bvb-alyans.ru",

  // Настройки батчевой обработки
  batch: {
    size: env.PARSING_BATCH_SIZE,
    delay: env.PARSING_DELAY_MS,
    maxRetries: env.PARSING_MAX_RETRIES,
  },

  // Настройки браузера
  browser: {
    userAgent: env.PARSING_USER_AGENT,
    viewport: {
      width: 1920,
      height: 1080,
    },
    headless: true,
    timeout: 30000, // 30 секунд
  },

  // Настройки задержек
  delays: {
    // Задержка между запросами (мс)
    betweenRequests: 1000,

    // Задержка между батчами (мс)
    betweenBatches: 5000,

    // Задержка при ошибке (мс)
    onError: 10000,

    // Задержка при rate limiting (мс)
    onRateLimit: 30000,
  },

  // Настройки retry логики
  retry: {
    maxAttempts: env.PARSING_MAX_RETRIES,
    backoffMultiplier: 2,
    maxBackoffDelay: 60000, // 1 минута
  },

  // Настройки прокси (если нужно)
  proxy: {
    enabled: false,
    servers: [] as string[],
    rotation: false,
  },

  // Настройки логирования
  logging: {
    level: env.LOG_LEVEL,
    saveToFile: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  },
};

// Настройки для разных типов парсинга
export const parsingTypes = {
  // Парсинг категорий
  categories: {
    enabled: true,
    priority: 1,
    maxDepth: 3,
    selectors: {
      categoryList: ".category-list",
      categoryItem: ".category-item",
      categoryLink: 'a[href*="/category/"]',
      categoryName: ".category-name",
      categoryCount: ".category-count",
    },
  },

  // Парсинг товаров
  products: {
    enabled: true,
    priority: 2,
    selectors: {
      productList: ".product-list",
      productItem: ".product-item",
      productLink: 'a[href*="/product/"]',
      productName: ".product-name",
      productPrice: ".product-price",
      productImage: ".product-image img",
    },
  },

  // Парсинг деталей товаров
  productDetails: {
    enabled: true,
    priority: 3,
    selectors: {
      title: "h1.product-title",
      price: ".product-price",
      description: ".product-description",
      specifications: ".product-specifications",
      images: ".product-images img",
      attributes: ".product-attributes",
    },
  },
};

// Настройки для обработки изображений
export const imageProcessing = {
  // Максимальный размер изображения
  maxSize: 5 * 1024 * 1024, // 5MB

  // Разрешенные форматы
  allowedFormats: ["jpg", "jpeg", "png", "webp"],

  // Настройки сжатия
  compression: {
    quality: 85,
    maxWidth: 2048,
    maxHeight: 2048,
  },

  // Настройки миниатюр
  thumbnails: {
    width: 300,
    height: 300,
    quality: 80,
  },
};

// Настройки для валидации данных
export const validationRules = {
  // Валидация категорий
  category: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    slug: {
      required: true,
      pattern: /^[a-z0-9-]+$/,
    },
    parentId: {
      required: false,
      type: "number",
    },
  },

  // Валидация товаров
  product: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 200,
    },
    price: {
      required: true,
      type: "number",
      min: 0,
    },
    description: {
      required: false,
      maxLength: 2000,
    },
    images: {
      required: false,
      maxCount: 10,
    },
  },
};

// Настройки для мониторинга
export const monitoringConfig = {
  // Метрики для отслеживания
  metrics: {
    // Количество обработанных элементов
    processedItems: 0,

    // Количество ошибок
    errors: 0,

    // Время выполнения
    executionTime: 0,

    // Успешность парсинга
    successRate: 0,
  },

  // Настройки уведомлений
  notifications: {
    enabled: true,
    channels: ["email", "webhook"],

    // События для уведомлений
    events: {
      onStart: true,
      onComplete: true,
      onError: true,
      onProgress: false, // Только для длительных операций
    },
  },

  // Настройки логирования
  logging: {
    level: env.LOG_LEVEL,
    format: "json",

    // Фильтры для логирования
    filters: {
      include: ["error", "warn", "info"],
      exclude: ["debug"],
    },
  },
};

// Утилиты для работы с конфигурацией
export const parsingUtils = {
  // Генерация задержки с учетом retry
  getRetryDelay: (attempt: number): number => {
    const baseDelay = parsingConfig.retry.backoffMultiplier ** attempt * 1000;
    return Math.min(baseDelay, parsingConfig.retry.maxBackoffDelay);
  },

  // Проверка необходимости retry
  shouldRetry: (error: Error, attempt: number): boolean => {
    if (attempt >= parsingConfig.retry.maxAttempts) {
      return false;
    }

    // Retry для сетевых ошибок
    const networkErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];
    return networkErrors.some(err => error.message.includes(err));
  },

  // Генерация User-Agent
  getUserAgent: (): string => {
    return parsingConfig.browser.userAgent;
  },

  // Проверка валидности URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Нормализация URL
  normalizeUrl: (url: string): string => {
    if (url.startsWith("/")) {
      return `${parsingConfig.baseUrl}${url}`;
    }
    if (url.startsWith("http")) {
      return url;
    }
    return `${parsingConfig.baseUrl}/${url}`;
  },
};

// Настройки для разных окружений
export const environmentParsingConfig = {
  development: {
    ...parsingConfig,
    browser: {
      ...parsingConfig.browser,
      headless: false, // Для отладки
    },
    logging: {
      ...parsingConfig.logging,
      level: "debug",
    },
  },

  staging: {
    ...parsingConfig,
    batch: {
      ...parsingConfig.batch,
      size: Math.min(parsingConfig.batch.size, 5), // Меньше батчи для staging
    },
  },

  production: {
    ...parsingConfig,
    browser: {
      ...parsingConfig.browser,
      headless: true,
    },
    logging: {
      ...parsingConfig.logging,
      level: "info",
    },
  },
};

// Получение конфигурации для текущего окружения
export const getCurrentParsingConfig = () => {
  return environmentParsingConfig[env.NODE_ENV];
};
