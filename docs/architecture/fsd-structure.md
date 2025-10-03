# FSD структура

[← Назад к документации](../README.md)

## Feature-Sliced Design архитектура

Проект построен на основе методологии Feature-Sliced Design (FSD) версии 2.1+, которая обеспечивает масштабируемость, поддерживаемость и четкое разделение ответственности.

## Структура слоев

### App Layer (Слой приложения)

```
src/app/
├── layout.tsx              # Корневой layout
├── page.tsx                # Главная страница
├── globals.css             # Глобальные стили
├── providers/              # Глобальные провайдеры
│   ├── theme-provider.tsx
│   ├── query-provider.tsx
│   └── auth-provider.tsx
└── api/                    # API routes
    ├── auth/
    ├── products/
    └── parsing/
```

### Pages Layer (Слой страниц)

```
src/views/
├── home/                   # Главная страница
│   ├── ui/
│   │   ├── HomePage/
│   │   └── index.ts
│   └── index.ts
├── catalog/                # Каталог товаров
│   ├── ui/
│   │   ├── CatalogPage/
│   │   └── index.ts
│   └── index.ts
├── product/                # Страница товара
│   ├── ui/
│   │   ├── ProductPage/
│   │   └── index.ts
│   └── index.ts
└── admin/                  # Админ-панель
    ├── ui/
    │   ├── AdminPage/
    │   └── index.ts
    └── index.ts
```

### Widgets Layer (Слой виджетов)

```
src/widgets/
├── product-card/           # Карточка товара
│   ├── ui/
│   │   ├── ProductCard/
│   │   └── index.ts
│   └── index.ts
├── product-list/           # Список товаров
│   ├── ui/
│   │   ├── ProductList/
│   │   └── index.ts
│   └── index.ts
├── search/                 # Поиск
│   ├── ui/
│   │   ├── SearchWidget/
│   │   └── index.ts
│   └── index.ts
└── filters/                # Фильтры
    ├── ui/
    │   ├── FiltersWidget/
    │   └── index.ts
    └── index.ts
```

### Features Layer (Слой функций)

```
src/features/
├── product-search/         # Поиск товаров
│   ├── ui/
│   ├── model/
│   └── api/
├── product-filters/       # Фильтрация товаров
│   ├── ui/
│   ├── model/
│   └── api/
├── product-favorites/      # Избранные товары
│   ├── ui/
│   ├── model/
│   └── api/
└── parsing-control/        # Управление парсингом
    ├── ui/
    ├── model/
    └── api/
```

### Entities Layer (Слой сущностей)

```
src/entities/
├── product/                # Сущность товара
│   ├── ui/
│   │   ├── ProductCard/
│   │   ├── ProductList/
│   │   └── ProductDetails/
│   ├── model/
│   │   ├── types.ts
│   │   ├── store.ts
│   │   └── hooks.ts
│   └── api/
│       ├── product-api.ts
│       └── types.ts
├── category/               # Сущность категории
│   ├── ui/
│   ├── model/
│   └── api/
├── user/                   # Сущность пользователя
│   ├── ui/
│   ├── model/
│   └── api/
└── parsing/                # Сущность парсинга
    ├── ui/
    ├── model/
    └── api/
```

### Shared Layer (Слой общих ресурсов)

```
src/shared/
├── ui/                     # Общие UI компоненты
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Layout/
├── lib/                    # Общие утилиты
│   ├── utils.ts
│   ├── constants.ts
│   └── helpers.ts
├── api/                    # API утилиты
│   ├── base-api.ts
│   ├── http-client.ts
│   └── types.ts
└── config/                 # Конфигурация
    ├── env.ts
    └── constants.ts
```

## Правила импортов

### Разрешенные импорты

- **App** → все слои
- **Pages** → Widgets, Features, Entities, Shared
- **Widgets** → Features, Entities, Shared
- **Features** → Entities, Shared
- **Entities** → Shared
- **Shared** → только внешние библиотеки

### Запрещенные импорты

- ❌ Импорт из того же слоя
- ❌ Импорт из вышестоящих слоев
- ❌ Циклические зависимости

## Сегменты внутри слоев

### UI сегмент

- React компоненты
- Стили и темы
- Форматирование данных

#### Структура компонентов

Каждый компонент должен быть организован в отдельной папке со следующей структурой:

```
ComponentName/
├── ComponentName.tsx    # Основной файл компонента
└── index.ts            # Экспорт для чистых импортов
```

**Пример:**

```
src/shared/ui/Button/
├── Button.tsx          # export function Button() { ... }
└── index.ts            # export { Button } from "./Button";
```

**Правила организации компонентов:**

1. **Папка компонента** - имя папки должно совпадать с именем компонента
2. **Основной файл** - `ComponentName.tsx` содержит реализацию компонента
3. **Index файл** - `index.ts` экспортирует компонент для чистых импортов
4. **Импорты** - используйте относительные импорты внутри папки компонента
5. **Экспорты** - экспортируйте только основной компонент через index.ts

**Примеры правильной структуры:**

```typescript
// src/shared/ui/Button/Button.tsx
export function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}

// src/shared/ui/Button/index.ts
export { Button } from "./Button";

// Использование в других компонентах
import { Button } from "@/shared/ui/Button";
```

### Model сегмент

- Бизнес-логика
- Состояние (stores, hooks)
- Типы и интерфейсы

### API сегмент

- HTTP запросы
- Типы API
- Обработка ошибок

### Lib сегмент

- Утилиты и хелперы
- Константы
- Конфигурация

## Проверка FSD архитектуры

### Steiger - инструмент валидации FSD

В проекте настроен **Steiger** - специализированный линтер для проверки соблюдения правил Feature-Sliced Design архитектуры.

#### Запуск проверки

```bash
npx steiger ./src
```

#### Что проверяет Steiger

- **Правила импортов**: Соблюдение иерархии слоев FSD
- **Циклические зависимости**: Отсутствие циклических импортов
- **Структуру сегментов**: Корректность организации кода внутри слоев
- **Публичные API**: Правильность экспортов из index.ts файлов

#### Интеграция в CI/CD

```bash
# В package.json
{
  "scripts": {
    "lint:fsd": "steiger ./src",
    "lint": "eslint . && steiger ./src"
  }
}
```

#### Автоматическая проверка

- **Pre-commit hooks**: Проверка перед каждым коммитом
- **CI/CD pipeline**: Автоматическая проверка в GitHub Actions
- **IDE интеграция**: Подсветка ошибок в редакторе

#### Примеры ошибок Steiger

```bash
❌ src/views/home/ui/HomePage.tsx
   Import from higher layer: shared → entities

❌ src/features/search/model/store.ts
   Circular dependency detected

❌ src/widgets/product-card/ui/ProductCard.tsx
   Missing index.ts export
```

## Преимущества FSD

### Масштабируемость

- Легкое добавление новых функций
- Изолированная разработка
- Минимальное влияние изменений

### Поддерживаемость

- Четкая структура кода
- Понятные зависимости
- Легкое тестирование

### Командная работа

- Параллельная разработка
- Четкое разделение ответственности
- Минимальные конфликты
