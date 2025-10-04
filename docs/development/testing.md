# Тестирование

[← Назад к документации](../README.md)

## Стратегия тестирования

Проект использует комплексный подход к тестированию с фокусом на качество, надежность и производительность.

## Пирамида тестирования

### Unit тесты (70%)

- Тестирование отдельных функций и компонентов
- Быстрое выполнение (< 100ms на тест)
- Высокое покрытие кода
- Изолированное тестирование

### Integration тесты (20%)

- Тестирование взаимодействия компонентов
- Тестирование с реальной базой данных
- API тестирование
- Тестирование бизнес-логики

### E2E тесты (10%)

- Тестирование полных пользовательских сценариев
- Тестирование в реальном браузере
- Критические пути пользователя
- Регрессионное тестирование

## Настройка тестового окружения

### Установка зависимостей

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev playwright
npm install --save-dev msw
npm install --save-dev @faker-js/faker next-intl
```

### Структура тестов

```
tests/
├── unit/                    # Unit тесты
├── integration/             # Integration тесты
└── e2e/                    # E2E тесты

src/shared/lib/test-utils/  # Тестовые утилиты
├── index.ts                # Экспорт всех утилит
├── render.tsx              # Кастомный render с провайдерами
├── mocks.ts                # Моки для тестов
├── data-factories.ts       # Фабрики тестовых данных
└── api-mocks.ts            # MSW хендлеры для API
```

### Конфигурация Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Конфигурация Playwright

```javascript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

## Unit тестирование

### Тестирование React компонентов

```typescript
// src/shared/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-500');
  });
});
```

### Тестирование хуков

```typescript
// src/entities/product/model/hooks/useProduct.test.ts
import { renderHook, act } from "@testing-library/react";
import { useProduct } from "./useProduct";

describe("useProduct", () => {
  it("fetches product data", async () => {
    const { result } = renderHook(() => useProduct("prod_123"));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

### Тестирование утилит

```typescript
// src/shared/lib/utils.test.ts
import { formatPrice, formatDate } from "./utils";

describe("utils", () => {
  describe("formatPrice", () => {
    it("formats price correctly", () => {
      expect(formatPrice(1500)).toBe("1 500 ₽");
      expect(formatPrice(1500.5)).toBe("1 500,50 ₽");
    });
  });

  describe("formatDate", () => {
    it("formats date correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      expect(formatDate(date)).toBe("15.01.2024");
    });
  });
});
```

## Integration тестирование

### Тестирование API endpoints

```typescript
// tests/integration/api/products.test.ts
import request from "supertest";
import { app } from "../../src/app";

describe("Products API", () => {
  describe("GET /api/v1/products", () => {
    it("returns list of products", async () => {
      const response = await request(app).get("/api/v1/products").expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it("filters products by category", async () => {
      const response = await request(app)
        .get("/api/v1/products?category=cat_123")
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/v1/products", () => {
    it("creates new product", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: 1000,
        categoryId: "cat_123",
      };

      const response = await request(app)
        .post("/api/v1/products")
        .send(productData)
        .expect(201);

      expect(response.body.data.name).toBe("Test Product");
    });
  });
});
```

### Тестирование с базой данных

```typescript
// tests/integration/database/products.test.ts
import { PrismaClient } from "@prisma/client";
import { ProductService } from "../../src/entities/product/api/product-service";

describe("ProductService", () => {
  let prisma: PrismaClient;
  let productService: ProductService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    productService = new ProductService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  it("creates product with category", async () => {
    const category = await prisma.category.create({
      data: {
        name: "Test Category",
        slug: "test-category",
      },
    });

    const product = await productService.createProduct({
      name: "Test Product",
      categoryId: category.id,
    });

    expect(product.name).toBe("Test Product");
    expect(product.categoryId).toBe(category.id);
  });
});
```

## E2E тестирование

### Тестирование пользовательских сценариев

```typescript
// tests/e2e/catalog.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test("user can browse products", async ({ page }) => {
    await page.goto("/catalog");

    // Проверяем загрузку каталога
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible();

    // Проверяем наличие товаров
    const products = page.locator('[data-testid="product-card"]');
    await expect(products).toHaveCountGreaterThan(0);
  });

  test("user can search products", async ({ page }) => {
    await page.goto("/catalog");

    // Вводим поисковый запрос
    await page.fill('[data-testid="search-input"]', "труба");
    await page.click('[data-testid="search-button"]');

    // Проверяем результаты поиска
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test("user can filter products by category", async ({ page }) => {
    await page.goto("/catalog");

    // Выбираем категорию
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-truby"]');

    // Проверяем фильтрацию
    await expect(
      page.locator('[data-testid="filtered-products"]')
    ).toBeVisible();
  });
});
```

### Тестирование админ-панели

```typescript
// tests/e2e/admin.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся как админ
    await page.goto("/admin/login");
    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');
  });

  test("admin can create product", async ({ page }) => {
    await page.goto("/admin/products");

    // Нажимаем кнопку создания товара
    await page.click('[data-testid="create-product-button"]');

    // Заполняем форму
    await page.fill('[data-testid="product-name"]', "Новый товар");
    await page.fill('[data-testid="product-description"]', "Описание товара");
    await page.fill('[data-testid="product-price"]', "1500");

    // Сохраняем товар
    await page.click('[data-testid="save-product-button"]');

    // Проверяем успешное создание
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## Мокирование

### MSW для API моков

```typescript
// src/test/mocks/handlers.ts
import { rest } from "msw";

export const handlers = [
  rest.get("/api/v1/products", (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: "prod_123",
            name: "Test Product",
            price: 1000,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      })
    );
  }),
];
```

### Мокирование внешних сервисов

```typescript
// src/test/mocks/aws-s3.ts
export const mockS3Service = {
  uploadImage: jest
    .fn()
    .mockResolvedValue("https://s3.amazonaws.com/bucket/image.jpg"),
  deleteImage: jest.fn().mockResolvedValue(undefined),
  getImageUrl: jest
    .fn()
    .mockReturnValue("https://s3.amazonaws.com/bucket/image.jpg"),
};
```

## Покрытие кода

### Настройка покрытия

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Генерация отчета покрытия

```bash
npm run test:coverage
```

### Доступные команды тестирования

```bash
# Unit тесты
npm run test                 # Запуск всех unit тестов
npm run test:watch          # Запуск в watch режиме
npm run test:coverage       # Запуск с покрытием кода
npm run test:ci             # Запуск для CI/CD

# E2E тесты
npm run test:e2e            # Запуск E2E тестов
npm run test:e2e:ui         # Запуск с UI
npm run test:e2e:headed     # Запуск в видимом браузере
npm run test:setup          # Установка браузеров для Playwright

# Все тесты
npm run test:all            # Запуск всех тестов
```

## CI/CD интеграция

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Лучшие практики

### Написание тестов

- **Один тест - одна проверка**
- **Понятные названия тестов**
- **Изоляция тестов**
- **Использование data-testid**

### Подготовка данных

- **Использование фабрик для тестовых данных**
- **Очистка данных между тестами**
- **Мокирование внешних зависимостей**

### Производительность

- **Параллельное выполнение тестов**
- **Кэширование зависимостей**
- **Оптимизация времени выполнения**
