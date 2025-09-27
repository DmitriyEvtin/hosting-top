# Система парсинга данных

[← Назад к документации](../README.md)

## Архитектура парсера

Система парсинга построена на модульной архитектуре с четким разделением ответственности между компонентами.

### Основные компоненты

#### BvbAlyansParser (Главный парсер)
```typescript
class BvbAlyansParser {
  private categoryParser: CategoryParser;
  private productParser: ProductParser;
  private productDetailsParser: ProductDetailsParser;
  private imageDownloader: ImageDownloader;
  private logger: ParsingLogger;
  
  async parseAll(): Promise<ParsingResult>
  async parseCategories(): Promise<Category[]>
  async parseProducts(categoryId: string): Promise<Product[]>
  async parseProductDetails(productUrl: string): Promise<ProductDetails>
}
```

#### CategoryParser (Парсер категорий)
```typescript
class CategoryParser {
  async parseCategories(): Promise<Category[]>
  async parseCategoryHierarchy(): Promise<CategoryHierarchy>
  private extractCategoryData(element: Element): CategoryData
  private validateCategoryData(data: CategoryData): boolean
}
```

#### ProductParser (Парсер товаров)
```typescript
class ProductParser {
  async parseProductsFromCategory(categoryUrl: string): Promise<Product[]>
  async parseProductList(pageUrl: string): Promise<Product[]>
  private extractProductData(element: Element): ProductData
  private handlePagination(): Promise<string[]>
}
```

#### ProductDetailsParser (Парсер деталей товара)
```typescript
class ProductDetailsParser {
  async parseProductDetails(productUrl: string): Promise<ProductDetails>
  async parseProductAttributes(page: Page): Promise<ProductAttribute[]>
  async parseProductImages(page: Page): Promise<string[]>
  private extractProductDescription(page: Page): string
  private extractProductSpecifications(page: Page): ProductSpecification[]
}
```

## Процесс парсинга

### Этап 1: Инициализация
1. **Проверка доступности сайта** - Проверка доступности bvb-alyans.ru
2. **Инициализация браузера** - Запуск Puppeteer с оптимальными настройками
3. **Создание сессии парсинга** - Запись в базу данных о начале парсинга
4. **Настройка логирования** - Инициализация системы логирования

### Этап 2: Парсинг категорий
1. **Получение главной страницы** - Загрузка каталога товаров
2. **Извлечение категорий** - Парсинг структуры категорий
3. **Построение иерархии** - Создание дерева категорий
4. **Валидация данных** - Проверка корректности категорий
5. **Сохранение в БД** - Запись категорий в базу данных

### Этап 3: Парсинг товаров
1. **Обход категорий** - Последовательный обход всех категорий
2. **Парсинг списков товаров** - Извлечение товаров из каждой категории
3. **Обработка пагинации** - Переход по страницам категорий
4. **Сбор URL товаров** - Сбор ссылок на детальные страницы
5. **Батчевая обработка** - Группировка товаров для эффективной обработки

### Этап 4: Парсинг деталей товаров
1. **Загрузка детальных страниц** - Переход на страницы товаров
2. **Извлечение характеристик** - Парсинг технических характеристик
3. **Скачивание изображений** - Загрузка и обработка изображений
4. **Валидация данных** - Проверка полноты данных
5. **Сохранение в БД** - Запись товаров в базу данных

### Этап 5: Завершение
1. **Статистика парсинга** - Подсчет обработанных товаров
2. **Обработка ошибок** - Анализ и логирование ошибок
3. **Очистка ресурсов** - Закрытие браузера и очистка памяти
4. **Уведомления** - Отправка уведомлений о завершении

## Конфигурация парсинга

### Настройки браузера
```typescript
const browserConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080
  }
};
```

### Настройки задержек
```typescript
const delayConfig = {
  pageLoad: 2000,        // Задержка загрузки страницы
  betweenRequests: 1000, // Задержка между запросами
  betweenProducts: 500,  // Задержка между товарами
  retryDelay: 5000      // Задержка при повторе запроса
};
```

### Настройки батчей
```typescript
const batchConfig = {
  maxConcurrentRequests: 5,    // Максимум одновременных запросов
  batchSize: 50,               // Размер батча для обработки
  maxRetries: 3,              // Максимум попыток повтора
  timeout: 30000              // Таймаут запроса
};
```

## Обработка ошибок

### Типы ошибок
- **Сетевые ошибки** - Проблемы с подключением
- **Таймауты** - Превышение времени ожидания
- **Парсинг ошибки** - Ошибки извлечения данных
- **Валидация ошибки** - Ошибки проверки данных

### Стратегии восстановления
```typescript
class ErrorHandler {
  async handleNetworkError(error: NetworkError): Promise<void>
  async handleTimeoutError(error: TimeoutError): Promise<void>
  async handleParsingError(error: ParsingError): Promise<void>
  async retryWithBackoff(operation: () => Promise<any>): Promise<any>
}
```

### Логирование ошибок
```typescript
class ParsingLogger {
  logError(error: Error, context: ParsingContext): void
  logWarning(message: string, context: ParsingContext): void
  logInfo(message: string, context: ParsingContext): void
  logDebug(message: string, context: ParsingContext): void
}
```

## Мониторинг и статистика

### Метрики парсинга
- **Общее время парсинга** - Время выполнения полного цикла
- **Количество товаров** - Общее количество обработанных товаров
- **Скорость парсинга** - Товаров в минуту
- **Процент успешности** - Соотношение успешных/неуспешных операций

### Реальное время мониторинга
```typescript
class ParsingMonitor {
  updateProgress(current: number, total: number): void
  updateStatistics(stats: ParsingStatistics): void
  logMilestone(milestone: string): void
  notifyCompletion(result: ParsingResult): void
}
```

### Уведомления
- **Email уведомления** - Отправка результатов на email
- **Webhook уведомления** - HTTP уведомления в внешние системы
- **Логи в консоль** - Детальное логирование процесса
- **Метрики в БД** - Сохранение статистики в базу данных
