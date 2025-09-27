# Базовый образ для всех стадий
FROM node:24-alpine AS base

# Стадия установки зависимостей
FROM base AS deps
# Установка libc6-compat для совместимости (может потребоваться для некоторых пакетов)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем зависимости в зависимости от менеджера пакетов
RUN npm install --force

# Стадия сборки
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Собираем приложение
RUN npm run build

# Стадия запуска
FROM base AS runner
WORKDIR /app

# Создаем non-root пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Переключаемся на non-root пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node_modules/.bin/next", "start"]