# Обработка изображений

## Архитектура обработки изображений

Система обработки изображений обеспечивает эффективную загрузку, оптимизацию и хранение изображений товаров в AWS S3.

### Основные компоненты

#### ImageDownloader (Загрузчик изображений)
```typescript
class ImageDownloader {
  private s3Service: S3ImageService;
  private optimizer: ImageOptimizer;
  private thumbnailGenerator: ThumbnailGenerator;
  
  async downloadAndProcess(imageUrl: string, productId: string): Promise<ProcessedImage>
  async downloadBatch(imageUrls: string[], productId: string): Promise<ProcessedImage[]>
  private validateImageUrl(url: string): boolean
  private generateUniqueFilename(originalUrl: string): string
}
```

#### S3ImageService (Сервис S3)
```typescript
class S3ImageService {
  private s3Client: S3Client;
  private bucketName: string;
  
  async uploadImage(image: Buffer, key: string, contentType: string): Promise<string>
  async uploadThumbnail(image: Buffer, key: string, size: ImageSize): Promise<string>
  async deleteImage(key: string): Promise<void>
  async getImageUrl(key: string): Promise<string>
  private generateS3Key(filename: string, productId: string): string
}
```

#### ImageOptimizer (Оптимизатор изображений)
```typescript
class ImageOptimizer {
  async optimizeImage(imageBuffer: Buffer, options: OptimizationOptions): Promise<Buffer>
  async convertToWebP(imageBuffer: Buffer): Promise<Buffer>
  async resizeImage(imageBuffer: Buffer, dimensions: Dimensions): Promise<Buffer>
  async compressImage(imageBuffer: Buffer, quality: number): Promise<Buffer>
  private detectImageFormat(buffer: Buffer): ImageFormat
  private calculateOptimalDimensions(original: Dimensions, maxSize: Dimensions): Dimensions
}
```

#### ThumbnailGenerator (Генератор миниатюр)
```typescript
class ThumbnailGenerator {
  async generateThumbnails(imageBuffer: Buffer, sizes: ThumbnailSize[]): Promise<Thumbnail[]>
  async generateSquareThumbnail(imageBuffer: Buffer, size: number): Promise<Buffer>
  async generateResponsiveThumbnails(imageBuffer: Buffer): Promise<ResponsiveThumbnail[]>
  private calculateCropArea(original: Dimensions, target: Dimensions): CropArea
  private applySmartCrop(imageBuffer: Buffer, cropArea: CropArea): Buffer
}
```

## Процесс обработки изображений

### Этап 1: Загрузка изображения
1. **Валидация URL** - Проверка корректности URL изображения
2. **HTTP запрос** - Загрузка изображения с исходного сайта
3. **Проверка формата** - Валидация формата изображения
4. **Проверка размера** - Контроль размера файла
5. **Сохранение во временное хранилище** - Временное сохранение для обработки

### Этап 2: Оптимизация изображения
1. **Анализ изображения** - Определение размеров и формата
2. **Сжатие** - Оптимизация размера файла
3. **Конвертация в WebP** - Конвертация в современный формат
4. **Коррекция качества** - Настройка качества сжатия
5. **Валидация результата** - Проверка качества оптимизации

### Этап 3: Генерация миниатюр
1. **Определение размеров** - Расчет размеров для разных устройств
2. **Создание миниатюр** - Генерация миниатюр разных размеров
3. **Smart Crop** - Умная обрезка для сохранения важных деталей
4. **Оптимизация миниатюр** - Сжатие миниатюр
5. **Валидация миниатюр** - Проверка качества миниатюр

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

## Конфигурация обработки

### Настройки оптимизации
```typescript
const optimizationConfig = {
  maxFileSize: 5 * 1024 * 1024,    // 5MB максимальный размер
  maxDimensions: {
    width: 2048,
    height: 2048
  },
  quality: {
    webp: 85,
    jpeg: 90,
    png: 95
  },
  formats: ['webp', 'jpeg', 'png'],
  enableProgressive: true
};
```

### Настройки миниатюр
```typescript
const thumbnailConfig = {
  sizes: [
    { name: 'small', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
    { name: 'xlarge', width: 1200, height: 1200 }
  ],
  cropMode: 'smart',              // smart, center, top, bottom
  maintainAspectRatio: true,
  enableWebP: true
};
```

### Настройки S3
```typescript
const s3Config = {
  bucket: process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION,
  acl: 'public-read',
  cacheControl: 'max-age=31536000', // 1 год кэширования
  contentType: 'image/webp',
  metadata: {
    'original-source': 'bvb-alyans.ru',
    'processed-by': 'rolled-metal-parser'
  }
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
  async handleDownloadError(error: DownloadError): Promise<RetryResult>
  async handleProcessingError(error: ProcessingError): Promise<FallbackResult>
  async handleUploadError(error: UploadError): Promise<RetryResult>
  async useFallbackImage(productId: string): Promise<string>
}
```

### Логирование ошибок
```typescript
class ImageLogger {
  logDownloadError(url: string, error: Error): void
  logProcessingError(imageId: string, error: Error): void
  logUploadError(key: string, error: Error): void
  logOptimizationStats(original: ImageStats, optimized: ImageStats): void
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
  updateProcessingStats(stats: ProcessingStats): void
  logImageMetrics(imageId: string, metrics: ImageMetrics): void
  trackS3Usage(usage: S3Usage): void
  alertOnErrors(errorCount: number): void
}
```

### Оптимизация производительности
- **Параллельная обработка** - Одновременная обработка нескольких изображений
- **Кэширование** - Кэширование обработанных изображений
- **Ленивая загрузка** - Загрузка изображений по требованию
- **CDN интеграция** - Использование CloudFront для быстрой доставки
