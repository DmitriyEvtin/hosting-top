# Базовый образ для всех стадий
FROM node:24-alpine AS base

# Установка системных зависимостей
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Стадия установки зависимостей
FROM base AS deps
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем зависимости
RUN npm ci --only=production && npm cache clean --force

# Стадия сборки
FROM base AS builder
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Устанавливаем переменные окружения для сборки
ENV NEXTAUTH_SECRET="docker-build-secret-key-for-production-build-32-chars"
ENV NEXTAUTH_URL="https://rolled-metal.example.com"
ENV DATABASE_URL="postgresql://user:password@localhost:5432/rolled_metal"
ENV NODE_ENV="production"

# Собираем приложение
RUN npm run build

# Стадия запуска
FROM base AS runner
WORKDIR /app

# Создаем non-root пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app

# Переключаемся на non-root пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Настраиваем health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/api/health || exit 1

# Запускаем приложение
CMD ["node", "server.js"]