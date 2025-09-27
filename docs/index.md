# Техническая документация: Каталог металлопроката с парсингом данных

## Обзор проекта

Система каталога металлопроката с автоматическим парсингом данных с сайта bvb-alyans.ru, админ-панелью для управления товарами и интеграцией с AWS S3 для хранения изображений.

### Основные возможности
- Автоматический парсинг каталога товаров с bvb-alyans.ru
- Админ-панель для управления товарами и категориями
- Хранение изображений в AWS S3
- Современный UI/UX с Tailwind CSS
- Архитектура Feature-Sliced Design (FSD)

## Технический стек

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL, Prisma ORM
- **Cloud Storage**: AWS S3
- **Architecture**: Feature-Sliced Design (FSD)
- **Parsing**: Puppeteer, Cheerio
- **Testing**: Jest, React Testing Library, Playwright

## Высокоуровневая архитектура

```mermaid
graph TB
    A[Пользователь] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[Prisma ORM]
    D --> E[PostgreSQL Database]
    
    F[Парсер данных] --> G[bvb-alyans.ru]
    F --> H[AWS S3]
    F --> D
    
    I[Админ-панель] --> C
    J[Каталог товаров] --> C
    
    K[AWS S3] --> L[Изображения товаров]
    
    subgraph "FSD Architecture"
        M[App Layer]
        N[Pages Layer]
        O[Widgets Layer]
        P[Features Layer]
        Q[Entities Layer]
        R[Shared Layer]
    end
```

## Структура базы данных

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@map("categories")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal?
  currency    String   @default("RUB")
  sku         String?
  title       String?
  metaDescription String?
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  specifications ProductSpecification[]
  isActive    Boolean  @default(true)
  isParsed    Boolean  @default(false)
  sourceUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@map("products")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  s3Key     String
  alt       String?
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@map("product_images")
}

model ProductSpecification {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String
  value     String
  unit      String?
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@map("product_specifications")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}
```

## FSD Архитектура проекта

### Структура папок

Компоненты называются по правилу ui\ComponentName\ComponentName.tsx + index.ts 

```
src/
├── app/                          # Next.js App Router + FSD App layer
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── admin/                   # Admin routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   └── categories/
│   └── api/                     # API routes
│       ├── products/
│       ├── categories/
│       ├── images/
│       └── parsing/
├── pages/                       # FSD Pages layer
│   ├── home/                    # Home page slice
│   │   ├── ui/
│   │   └── index.ts
│   ├── catalog/                 # Catalog page slice
│   │   ├── ui/
│   │   └── index.ts
│   ├── product/                 # Product detail page slice
│   │   ├── ui/
│   │   └── index.ts
│   └── admin/                   # Admin pages slice
│       ├── ui/
│       └── index.ts
├── widgets/                     # Widgets layer
│   ├── product-card/            # Product card widget
│   │   ├── ui/
│   │   └── index.ts
│   ├── product-grid/            # Product grid widget
│   │   ├── ui/
│   │   └── index.ts
│   ├── category-tree/           # Category tree widget
│   │   ├── ui/
│   │   └── index.ts
│   ├── search-filters/          # Search filters widget
│   │   ├── ui/
│   │   └── index.ts
│   └── admin-sidebar/           # Admin sidebar widget
│       ├── ui/
│       └── index.ts
├── features/                    # Features layer
│   ├── search/                  # Search feature
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── filtering/               # Product filtering feature
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── pagination/              # Pagination feature
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── image-upload/            # Image upload feature
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   └── data-parsing/            # Data parsing feature
│       ├── ui/
│       ├── model/
│       └── api/
├── entities/                    # Entities layer
│   ├── product/                 # Product entity
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── category/                # Category entity
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── image/                   # Image entity
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   └── user/                    # User entity
│       ├── ui/
│       ├── model/
│       └── api/
└── shared/                      # Shared layer
    ├── ui/                      # Shared UI components
    │   ├── Button/
    │   ├── Input/
    │   ├── Modal/
    │   ├── Table/
    │   └── Layout/
    ├── api/                     # Shared API utilities
    │   ├── database/
    │   ├── aws-s3/
    │   └── parsing/
    ├── lib/                     # Shared utilities
    │   ├── prisma/
    │   ├── aws/
    │   ├── parsing/
    │   └── validation/
    └── config/                  # Shared configuration
        ├── database.ts
        ├── aws.ts
        └── parsing.ts
```

## API Endpoints

### Каталог товаров

```typescript
// GET /api/products
// Query parameters: page, limit, category, search, sort, filters
interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: FilterOption[];
}

// GET /api/products/[id]
interface ProductResponse {
  product: Product;
  relatedProducts: Product[];
}

// GET /api/categories
interface CategoriesResponse {
  categories: Category[];
}

// GET /api/categories/[id]/products
interface CategoryProductsResponse {
  products: Product[];
  category: Category;
  pagination: PaginationInfo;
}
```

### Админ-панель

```typescript
// POST /api/admin/products
interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  categoryId: string;
  specifications: ProductSpecification[];
  images: File[];
}

// PUT /api/admin/products/[id]
interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  specifications?: ProductSpecification[];
  images?: File[];
}

// DELETE /api/admin/products/[id]
// POST /api/admin/categories
// PUT /api/admin/categories/[id]
// DELETE /api/admin/categories/[id]

// POST /api/admin/parsing/start
interface ParsingRequest {
  categories?: string[];
  maxProducts?: number;
  updateExisting?: boolean;
}

// GET /api/admin/parsing/status
interface ParsingStatusResponse {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentCategory?: string;
  processedProducts: number;
  totalProducts: number;
  errors: string[];
}
```

## Компоненты UI/UX

### Каталог товаров

```typescript
// src/widgets/product-grid/ui/product-grid.tsx
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick: (product: Product) => void;
}

// src/widgets/product-card/ui/product-card.tsx
interface ProductCardProps {
  product: Product;
  onClick: () => void;
  showPrice?: boolean;
  showSpecifications?: boolean;
}

// src/widgets/search-filters/ui/search-filters.tsx
interface SearchFiltersProps {
  categories: Category[];
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}
```

### Админ-панель

```typescript
// src/pages/admin/ui/admin-layout.tsx
interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

// src/widgets/admin-sidebar/ui/admin-sidebar.tsx
interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// src/features/image-upload/ui/image-upload.tsx
interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<string[]>;
  maxFiles?: number;
  acceptedTypes?: string[];
}
```

## Система парсинга данных

### Архитектура парсера

```typescript
// src/shared/lib/parsing/parser.ts
export class BvbAlyansParser {
  private browser: Browser;
  private page: Page;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
  }

  async parseCategories(): Promise<CategoryData[]> {
    // Парсинг категорий с главной страницы
  }

  async parseProducts(categoryUrl: string): Promise<ProductData[]> {
    // Парсинг товаров из категории
  }

  async parseProductDetails(productUrl: string): Promise<ProductDetails> {
    // Парсинг детальной информации о товаре
  }

  async downloadImage(imageUrl: string): Promise<Buffer> {
    // Скачивание изображения
  }
}
```

### Обработка изображений

```typescript
// src/shared/lib/aws/s3-client.ts
export class S3ImageService {
  private s3: AWS.S3;

  async uploadImage(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteImage(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }).promise();
  }
}
```

## Конфигурация сервисов

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/rolled_metal"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="rolled-metal-images"
AWS_REGION="us-east-1"

# Parsing Configuration
PARSING_BATCH_SIZE=50
PARSING_DELAY_MS=1000
MAX_CONCURRENT_REQUESTS=5
```

### Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bvb-alyans.ru',
        pathname: '/**'
      }
    ]
  },
  webpack: (config) => {
    config.externals.push({
      'puppeteer': 'commonjs puppeteer'
    });
    return config;
  }
}

export default nextConfig
```

### Prisma Configuration

```typescript
// src/shared/api/database/prisma-client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Мониторинг и логирование

### Система логирования

```typescript
// src/shared/lib/logger.ts
export class Logger {
  static info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data);
  }

  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }

  static parsing(message: string, data?: any): void {
    console.log(`[PARSING] ${message}`, data);
  }
}
```

### Мониторинг парсинга

```typescript
// src/features/data-parsing/model/parsing-store.ts
export class ParsingStore {
  private status: ParsingStatus = 'idle';
  private progress: number = 0;
  private errors: string[] = [];

  getStatus(): ParsingStatus {
    return this.status;
  }

  getProgress(): number {
    return this.progress;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
```

## Безопасность

### Аутентификация

```typescript
// src/shared/lib/auth/auth-config.ts
export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Проверка учетных данных
      }
    })
  ],
  pages: {
    signIn: '/admin/login'
  }
}
```

### Валидация данных

```typescript
// src/shared/lib/validation/product-schema.ts
export const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().cuid(),
  specifications: z.array(z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string().optional()
  })).optional()
});
```

## Производительность

### Оптимизация изображений

```typescript
// src/shared/lib/image-optimization.ts
export class ImageOptimizer {
  static async optimizeImage(buffer: Buffer): Promise<Buffer> {
    // Оптимизация изображения с помощью sharp
  }

  static async generateThumbnails(buffer: Buffer): Promise<{
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    // Генерация миниатюр разных размеров
  }
}
```

### Кэширование

```typescript
// src/shared/lib/cache/redis-client.ts
export class CacheService {
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

## Тестирование

### Unit тесты

```typescript
// src/entities/product/api/__tests__/product-repository.test.ts
describe('ProductRepository', () => {
  it('should create a product', async () => {
    const productData = {
      name: 'Test Product',
      categoryId: 'category-id'
    };

    const product = await ProductRepository.create(productData);
    expect(product).toBeDefined();
    expect(product.name).toBe(productData.name);
  });
});
```

### E2E тесты

```typescript
// tests/e2e/catalog.spec.ts
test('user can browse products', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  await page.click('[data-testid="product-card"]');
  await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
});
```

## Деплой и CI/CD

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npx prisma migrate deploy
      - run: npm run start
```

## Заключение

Данная документация предоставляет полное техническое описание для разработки каталога металлопроката с автоматическим парсингом данных, админ-панелью и интеграцией с AWS S3. Архитектура основана на современных технологиях и лучших практиках разработки, обеспечивая масштабируемость, производительность и удобство сопровождения.

Система готова к разработке в Cursor AI с четкой структурой, детальными спецификациями и готовыми к использованию компонентами.
