# Схема базы данных

[← Назад к документации](../README.md)

## Обзор

База данных построена на PostgreSQL с использованием Prisma ORM. Схема спроектирована для системы управления пользователями и аутентификации.

## Основные модели

### User (Пользователи)

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  role            UserRole  @default(USER)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  emailVerified   DateTime?
  image           String?
  password        String?
  accounts        Account[]
  sessions        Session[]

  @@map("users")
}

enum UserRole {
  ADMIN
  USER
  MODERATOR
}
```

### Account (Аккаунты OAuth)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

### Session (Сессии)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### VerificationToken (Токены верификации)

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

## Индексы для производительности

### Основные индексы

```sql
-- Поиск пользователей
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Поиск сессий
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires);

-- Поиск аккаунтов
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);

-- Токены верификации
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
```

## Связи между таблицами

### Аутентификация и авторизация

- Пользователь может иметь множество аккаунтов OAuth
- Пользователь может иметь множество активных сессий
- Аккаунты и сессии привязаны к пользователю с каскадным удалением

### Управление сессиями

- Сессии имеют срок действия
- Автоматическое удаление истекших сессий
- Поддержка множественных сессий для одного пользователя

## Миграции

### Стратегия миграций

- Инкрементальные изменения схемы
- Обратная совместимость при возможности
- Резервное копирование перед критическими изменениями

### Примеры миграций

```sql
-- Добавление индекса для поиска пользователей
CREATE INDEX CONCURRENTLY idx_users_email_search ON users(email);

-- Добавление индекса для сессий
CREATE INDEX CONCURRENTLY idx_sessions_expires ON sessions(expires);
```

## Оптимизация производительности

### Кэширование

- Кэширование информации о пользователях
- Кэширование активных сессий
- Кэширование OAuth токенов

### Мониторинг

- Мониторинг производительности запросов аутентификации
- Отслеживание медленных запросов
- Анализ использования индексов
- Мониторинг истекших сессий
