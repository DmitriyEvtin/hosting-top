# Обработка изображений

[← Назад к документации](../README.md)

## Архитектура обработки изображений

Система обработки изображений обеспечивает эффективную загрузку, оптимизацию и хранение изображений товаров в AWS S3.

### Основные компоненты

#### ImageDownloader (Загрузчик изображений)

```typescript
class ImageDownloader {
  private s3Service: S3ImageService;
  private optimizer: ImageOptimizer;
  private thumbnailGenerator: ThumbnailGenerator;

  async downloadAndProcess(
    imageUrl: string,
    productId: string
  ): Promise<ProcessedImage>;
  async downloadBatch(
    imageUrls: string[],
    productId: string
  ): Promise<ProcessedImage[]>;
  private validateImageUrl(url: string): boolean;
  private generateUniqueFilename(originalUrl: string): string;
}
```

#### S3ImageService (Сервис S3)

```typescript
class S3ImageService {
  private s3Client: S3Client;
  private bucketName: string;

  async uploadImage(
    image: Buffer,
    key: string,
    contentType: string
  ): Promise<string>;
  async uploadThumbnail(
    image: Buffer,
    key: string,
    size: ImageSize
  ): Promise<string>;
  async deleteImage(key: string): Promise<void>;
  async getImageUrl(key: string): Promise<string>;
  private generateS3Key(filename: string, productId: string): string;
}
```

#### ImageOptimizer (Оптимизатор изображений)

```typescript
class ImageOptimizer {
  private caravaggioService: CaravaggioService;

  async optimizeImage(
    imageBuffer: Buffer,
    options: OptimizationOptions
  ): Promise<Buffer>;
  async convertToWebP(imageBuffer: Buffer): Promise<Buffer>;
  async resizeImage(
    imageBuffer: Buffer,
    dimensions: Dimensions
  ): Promise<Buffer>;
  async compressImage(imageBuffer: Buffer, quality: number): Promise<Buffer>;
  private detectImageFormat(buffer: Buffer): ImageFormat;
  private calculateOptimalDimensions(
    original: Dimensions,
    maxSize: Dimensions
  ): Dimensions;
}
```

#### CaravaggioService (Сервис Caravaggio)

```typescript
class CaravaggioService {
  private caravaggioUrl: string;
  private httpClient: HttpClient;

  async processImage(
    imageUrl: string,
    options: CaravaggioOptions
  ): Promise<Buffer>;
  async resizeImage(
    imageUrl: string,
    width: number,
    height: number
  ): Promise<Buffer>;
  async convertFormat(imageUrl: string, format: ImageFormat): Promise<Buffer>;
  async optimizeImage(imageUrl: string, quality: number): Promise<Buffer>;
  private buildCaravaggioUrl(
    imageUrl: string,
    options: CaravaggioOptions
  ): string;
  private validateCaravaggioResponse(response: Response): boolean;
}
```

#### ThumbnailGenerator (Генератор миниатюр)

```typescript
class ThumbnailGenerator {
  async generateThumbnails(
    imageBuffer: Buffer,
    sizes: ThumbnailSize[]
  ): Promise<Thumbnail[]>;
  async generateSquareThumbnail(
    imageBuffer: Buffer,
    size: number
  ): Promise<Buffer>;
  async generateResponsiveThumbnails(
    imageBuffer: Buffer
  ): Promise<ResponsiveThumbnail[]>;
  private calculateCropArea(original: Dimensions, target: Dimensions): CropArea;
  private applySmartCrop(imageBuffer: Buffer, cropArea: CropArea): Buffer;
}
```

## Процесс обработки изображений

### Этап 1: Загрузка изображения

1. **Валидация URL** - Проверка корректности URL изображения
2. **HTTP запрос** - Загрузка изображения с исходного сайта
3. **Проверка формата** - Валидация формата изображения
4. **Проверка размера** - Контроль размера файла
5. **Сохранение во временное хранилище** - Временное сохранение для обработки

### Этап 2: Оптимизация изображения через Caravaggio

1. **Отправка в Caravaggio** - Передача URL изображения в Docker контейнер
2. **Анализ изображения** - Определение размеров и формата
3. **Сжатие** - Оптимизация размера файла через Caravaggio API
4. **Конвертация в WebP** - Конвертация в современный формат
5. **Коррекция качества** - Настройка качества сжатия
6. **Получение результата** - Загрузка обработанного изображения
7. **Валидация результата** - Проверка качества оптимизации

### Этап 3: Генерация миниатюр через Caravaggio

1. **Определение размеров** - Расчет размеров для разных устройств
2. **Параллельная обработка** - Одновременная генерация всех размеров через Caravaggio API
3. **Smart Crop** - Умная обрезка для сохранения важных деталей (fit=cover)
4. **Оптимизация миниатюр** - Сжатие миниатюр с настройкой качества
5. **Получение результатов** - Загрузка всех обработанных миниатюр
6. **Валидация миниатюр** - Проверка качества миниатюр

### Этап 4: Загрузка в S3

1. **Генерация ключей** - Создание уникальных ключей для S3
2. **Загрузка основного изображения** - Загрузка оптимизированного изображения
3. **Загрузка миниатюр** - Загрузка всех размеров миниатюр
4. **Настройка метаданных** - Установка метаданных для изображений
5. **Настройка CORS** - Конфигурация доступа к изображениям

### Этап 5: Сохранение в БД

1. **Создание записей** - Создание записей в таблице product_images
2. **Связывание с товаром** - Привязка изображений к товару
3. **Установка главного изображения** - Определение главного изображения
4. **Сохранение метаданных** - Сохранение размеров и формата
5. **Очистка временных файлов** - Удаление временных файлов

## Docker контейнер Caravaggio

### Конфигурация Caravaggio

Система использует Docker контейнер `ramielcreations/caravaggio` для оптимизации и ресайзинга изображений. Caravaggio предоставляет REST API для обработки изображений с поддержкой различных форматов и операций.

#### Docker Compose конфигурация

```yaml
version: "3.8"
services:
  caravaggio:
    image: ramielcreations/caravaggio:latest
    container_name: rolled-metal-caravaggio
    ports:
      - "3001:3000"
    environment:
      - CARAVAGGIO_BASE_URL=http://localhost:3001
      - CARAVAGGIO_ALLOWED_DOMAINS=localhost
      - CARAVAGGIO_MAX_FILE_SIZE=10485760 # 10MB
      - CARAVAGGIO_CACHE_TTL=86400 # 24 часа
    volumes:
      - caravaggio_cache:/app/cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  caravaggio_cache:
```

#### Настройки Caravaggio

```typescript
const caravaggioConfig = {
  baseUrl: process.env.CARAVAGGIO_BASE_URL || "http://localhost:3001",
  allowedDomains: [
    "localhost",
    // TODO: Добавить домен проекта когда он будет определен
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  cacheTtl: 24 * 60 * 60, // 24 часа
  timeout: 30000, // 30 секунд
  retryAttempts: 3,
  supportedFormats: ["jpeg", "jpg", "png", "webp", "gif"],
  defaultQuality: 85,
};
```

#### API операции Caravaggio

```typescript
interface CaravaggioOptions {
  w?: number; // Ширина
  h?: number; // Высота
  q?: number; // Качество (1-100)
  f?: string; // Формат (webp, jpeg, png)
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: "top" | "bottom" | "left" | "right" | "center";
  bg?: string; // Цвет фона
  blur?: number; // Размытие
  sharpen?: number; // Резкость
  gamma?: number; // Гамма-коррекция
  brightness?: number; // Яркость
  contrast?: number; // Контрастность
  saturation?: number; // Насыщенность
  hue?: number; // Оттенок
}

// Примеры использования
const examples = {
  resize: "/caravaggio?url=IMAGE_URL&w=800&h=600&fit=cover",
  convert: "/caravaggio?url=IMAGE_URL&f=webp&q=85",
  optimize: "/caravaggio?url=IMAGE_URL&q=90&f=webp",
  thumbnail: "/caravaggio?url=IMAGE_URL&w=300&h=300&fit=cover&q=80",
};
```

## Конфигурация обработки

### Настройки оптимизации

```typescript
const optimizationConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB максимальный размер
  maxDimensions: {
    width: 2048,
    height: 2048,
  },
  quality: {
    webp: 85,
    jpeg: 90,
    png: 95,
  },
  formats: ["webp", "jpeg", "png"],
  enableProgressive: true,
};
```

### Настройки миниатюр

```typescript
const thumbnailConfig = {
  sizes: [
    { name: "small", width: 150, height: 150 },
    { name: "medium", width: 300, height: 300 },
    { name: "large", width: 600, height: 600 },
    { name: "xlarge", width: 1200, height: 1200 },
  ],
  cropMode: "smart", // smart, center, top, bottom
  maintainAspectRatio: true,
  enableWebP: true,
};
```

### Настройки S3

```typescript
const s3Config = {
  bucket: process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION,
  acl: "public-read",
  cacheControl: "max-age=31536000", // 1 год кэширования
  contentType: "image/webp",
  metadata: {
    "original-source": "bvb-alyans.ru",
    "processed-by": "rolled-metal-parser",
  },
};
```

## Обработка ошибок

### Типы ошибок изображений

- **Сетевые ошибки** - Проблемы с загрузкой изображения
- **Формат ошибки** - Неподдерживаемые форматы изображений
- **Размер ошибки** - Превышение максимального размера
- **S3 ошибки** - Проблемы с загрузкой в S3
- **Обработка ошибки** - Ошибки оптимизации

### Стратегии восстановления

```typescript
class ImageErrorHandler {
  async handleDownloadError(error: DownloadError): Promise<RetryResult>;
  async handleProcessingError(error: ProcessingError): Promise<FallbackResult>;
  async handleUploadError(error: UploadError): Promise<RetryResult>;
  async useFallbackImage(productId: string): Promise<string>;
}
```

### Логирование ошибок

```typescript
class ImageLogger {
  logDownloadError(url: string, error: Error): void;
  logProcessingError(imageId: string, error: Error): void;
  logUploadError(key: string, error: Error): void;
  logOptimizationStats(original: ImageStats, optimized: ImageStats): void;
}
```

## Мониторинг и статистика

### Метрики обработки

- **Время обработки** - Время обработки одного изображения
- **Размер сжатия** - Процент сжатия изображения
- **Успешность загрузки** - Процент успешных загрузок
- **Использование S3** - Статистика использования S3

### Мониторинг в реальном времени

```typescript
class ImageMonitor {
  updateProcessingStats(stats: ProcessingStats): void;
  logImageMetrics(imageId: string, metrics: ImageMetrics): void;
  trackS3Usage(usage: S3Usage): void;
  alertOnErrors(errorCount: number): void;
}
```

### Оптимизация производительности

- **Параллельная обработка** - Одновременная обработка нескольких изображений
- **Кэширование** - Кэширование обработанных изображений в Caravaggio
- **Ленивая загрузка** - Загрузка изображений по требованию
- **CDN интеграция** - Использование CloudFront для быстрой доставки
- **Docker масштабирование** - Горизонтальное масштабирование Caravaggio контейнеров

## Управление Caravaggio контейнером

### Запуск и остановка

```bash
# Запуск Caravaggio контейнера
docker-compose up -d caravaggio

# Проверка статуса
docker-compose ps caravaggio

# Просмотр логов
docker-compose logs -f caravaggio

# Остановка контейнера
docker-compose stop caravaggio

# Перезапуск контейнера
docker-compose restart caravaggio
```

### Мониторинг Caravaggio

```typescript
class CaravaggioMonitor {
  async checkHealth(): Promise<HealthStatus>;
  async getMetrics(): Promise<CaravaggioMetrics>;
  async getCacheStats(): Promise<CacheStats>;
  async clearCache(): Promise<void>;
  async restartService(): Promise<void>;
}

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface CaravaggioMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  processedImages: number;
}
```

### Масштабирование Caravaggio

```yaml
# docker-compose.override.yml для продакшена
version: "3.8"
services:
  caravaggio:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: "0.5"
        reservations:
          memory: 512M
          cpus: "0.25"
    environment:
      - CARAVAGGIO_CACHE_TTL=86400
      - CARAVAGGIO_MAX_FILE_SIZE=10485760
```

### Резервное копирование и восстановление

```bash
# Создание бэкапа кэша Caravaggio
docker run --rm -v rolled-metal_caravaggio_cache:/data -v $(pwd):/backup alpine tar czf /backup/caravaggio-cache-$(date +%Y%m%d).tar.gz -C /data .

# Восстановление кэша
docker run --rm -v rolled-metal_caravaggio_cache:/data -v $(pwd):/backup alpine tar xzf /backup/caravaggio-cache-20240101.tar.gz -C /data
```
