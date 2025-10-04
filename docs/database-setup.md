# Настройка базы данных

## Обзор

Проект использует PostgreSQL в качестве основной базы данных с Prisma ORM для работы с данными.

## Структура базы данных

### Основные модели

- **User** - Пользователи системы (администраторы и обычные пользователи)
- **Account** - OAuth аккаунты пользователей
- **Session** - Сессии пользователей
- **VerificationToken** - Токены для верификации email

## Запуск базы данных

### 1. Запуск PostgreSQL и Redis через Docker

```bash
# Запуск всех сервисов
docker compose up -d

# Запуск только базы данных и Redis
docker compose up -d postgres redis

# Просмотр логов
docker compose logs -f postgres
```

### 2. Подключение к базе данных

- **PostgreSQL**: `localhost:5432`
- **База данных**: `parket_crm`
- **Пользователь**: `parket_crm_user`
- **Пароль**: `parket_crm_password`

### 3. Веб-интерфейс для управления БД

```bash
# Запуск Adminer (веб-интерфейс для PostgreSQL)
docker compose up -d adminer
```

Откройте http://localhost:8080 и используйте следующие данные:

- **Сервер**: `postgres`
- **Пользователь**: `parket_crm_user`
- **Пароль**: `parket_crm_password`
- **База данных**: `parket_crm`

## Работа с Prisma

### Генерация клиента

```bash
npm run db:generate
```

### Миграции

```bash
# Создание новой миграции
npm run db:migrate

# Сброс базы данных (удаляет все данные!)
npm run db:reset
```

### Заполнение тестовыми данными

```bash
# Заполнение базы данных тестовыми данными
npm run db:seed
```

### Prisma Studio

```bash
# Запуск веб-интерфейса Prisma Studio
npm run db:studio
```

Откройте http://localhost:5555 для просмотра и редактирования данных.

## Переменные окружения

Создайте файл `.env` на основе `env.example`:

```bash
cp env.example .env
```

Обязательные переменные:

- `DATABASE_URL` - URL подключения к PostgreSQL
- `REDIS_URL` - URL подключения к Redis

## Структура проекта

```
prisma/
├── schema.prisma          # Схема базы данных
├── migrations/            # Миграции базы данных
└── seed.ts               # Скрипт заполнения тестовыми данными

src/shared/api/database/
├── prisma.ts             # Конфигурация Prisma клиента
└── index.ts              # Экспорт Prisma клиента
```

## Полезные команды

```bash
# Просмотр статуса контейнеров
docker compose ps

# Остановка всех сервисов
docker compose down

# Остановка с удалением данных
docker compose down -v

# Просмотр логов конкретного сервиса
docker compose logs postgres
docker compose logs redis
```

## Troubleshooting

### Проблема с подключением к базе данных

1. Убедитесь, что PostgreSQL запущен:

   ```bash
   docker compose ps
   ```

2. Проверьте переменные окружения в `.env`

3. Попробуйте пересоздать контейнеры:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Проблемы с миграциями

1. Сбросьте базу данных:

   ```bash
   npm run db:reset
   ```

2. Запустите миграции заново:

   ```bash
   npm run db:migrate
   ```

3. Заполните тестовыми данными:
   ```bash
   npm run db:seed
   ```
