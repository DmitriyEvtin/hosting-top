# Database Layer (FSD Architecture)

Эта папка содержит все компоненты для работы с базой данных согласно принципам Feature-Sliced Design.

## Структура

```
src/shared/api/database/
├── client.ts          # Основной Prisma клиент
├── prisma.ts          # Re-export для обратной совместимости
├── index.ts           # Публичный API модуля
├── prisma/            # Сгенерированный Prisma клиент
│   ├── index.js       # Основной экспорт Prisma
│   ├── index.d.ts     # TypeScript типы
│   └── ...            # Другие файлы Prisma
└── README.md          # Этот файл
```

## Использование

### Импорт Prisma клиента

```typescript
import { prisma } from "@/shared/api/database";
```

### Импорт типов

```typescript
import type { Prisma } from "@/shared/api/database";
```

## Принципы FSD

- **Изоляция**: Все компоненты базы данных изолированы в этом слое
- **Переиспользование**: Клиент может использоваться во всех слоях приложения
- **Типизация**: Полная типизация через Prisma
- **Конфигурация**: Централизованная настройка подключения

## Конфигурация

Prisma клиент настраивается в `client.ts`:

- Логирование запросов в development
- Singleton pattern для предотвращения множественных подключений
- Автоматическое отключение в production

## Миграции

Миграции находятся в корне проекта в папке `prisma/`:

- `schema.prisma` - схема базы данных
- `migrations/` - файлы миграций
- `seed.ts` - скрипт заполнения тестовыми данными
