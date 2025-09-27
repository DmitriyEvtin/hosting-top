# Схема базы данных

## Обзор

База данных построена на PostgreSQL с использованием Prisma ORM. Схема спроектирована для эффективного хранения и поиска данных о товарах металлопроката.

## Основные модели

### User (Пользователи)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  sessions  Session[]
  
  @@map("users")
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}
```

### Category (Категории)
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  imageUrl    String?
  
  // Hierarchy
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  
  // Relations
  products    Product[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("categories")
}
```

### Product (Товары)
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal?
  currency    String   @default("RUB")
  
  // Relations
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  attributes  ProductAttribute[]
  
  // Parsing metadata
  sourceUrl   String?
  parsedAt    DateTime?
  isActive    Boolean  @default(true)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

### ProductImage (Изображения товаров)
```prisma
model ProductImage {
  id        String  @id @default(cuid())
  url       String
  alt       String?
  width     Int?
  height    Int?
  size      Int?    // File size in bytes
  isMain    Boolean @default(false)
  
  // Relations
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt DateTime @default(now())
  
  @@map("product_images")
}
```

### ProductAttribute (Атрибуты товаров)
```prisma
model ProductAttribute {
  id        String @id @default(cuid())
  name      String
  value     String
  unit      String?
  
  // Relations
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("product_attributes")
}
```

### ParsingSession (Сессии парсинга)
```prisma
model ParsingSession {
  id          String        @id @default(cuid())
  status      ParsingStatus @default(PENDING)
  startedAt   DateTime      @default(now())
  completedAt DateTime?
  
  // Statistics
  totalItems  Int     @default(0)
  parsedItems Int     @default(0)
  errorItems  Int     @default(0)
  
  // Relations
  logs        ParsingLog[]
  
  @@map("parsing_sessions")
}

enum ParsingStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### ParsingLog (Логи парсинга)
```prisma
model ParsingLog {
  id        String      @id @default(cuid())
  level     LogLevel
  message   String
  data      Json?
  
  // Relations
  sessionId String
  session   ParsingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt DateTime @default(now())
  
  @@map("parsing_logs")
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
}
```

## Индексы для производительности

### Основные индексы
```sql
-- Поиск товаров
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('russian', name));
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- Поиск категорий
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Поиск изображений
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_main ON product_images(is_main) WHERE is_main = true;

-- Логи парсинга
CREATE INDEX idx_parsing_logs_session ON parsing_logs(session_id);
CREATE INDEX idx_parsing_logs_level ON parsing_logs(level);
CREATE INDEX idx_parsing_logs_created ON parsing_logs(created_at);
```

### Полнотекстовый поиск
```sql
-- Русский полнотекстовый поиск
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('russian', name || ' ' || COALESCE(description, ''))
);

-- Поиск по атрибутам
CREATE INDEX idx_attributes_search ON product_attributes USING gin(
  to_tsvector('russian', name || ' ' || value)
);
```

## Связи между таблицами

### Иерархия категорий
- Категории могут иметь родительские категории
- Поддерживается многоуровневая иерархия
- Каскадное удаление при удалении родительской категории

### Связи товаров
- Товар принадлежит одной категории
- Товар может иметь множество изображений
- Товар может иметь множество атрибутов

### Управление парсингом
- Сессия парсинга содержит множество логов
- Логи привязаны к конкретной сессии
- Статистика парсинга хранится в сессии

## Миграции

### Стратегия миграций
- Инкрементальные изменения схемы
- Обратная совместимость при возможности
- Резервное копирование перед критическими изменениями

### Примеры миграций
```sql
-- Добавление индекса для поиска
CREATE INDEX CONCURRENTLY idx_products_search_new ON products 
USING gin(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

-- Удаление старого индекса
DROP INDEX CONCURRENTLY idx_products_search_old;
```

## Оптимизация производительности

### Партиционирование
- Партиционирование логов по дате
- Автоматическое удаление старых логов

### Кэширование
- Кэширование часто запрашиваемых категорий
- Кэширование результатов поиска
- Кэширование статистики парсинга

### Мониторинг
- Мониторинг производительности запросов
- Отслеживание медленных запросов
- Анализ использования индексов
