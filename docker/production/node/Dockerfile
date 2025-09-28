# Оптимизированный Dockerfile для production
# Использует лучшие практики для Next.js приложений

# Базовый образ для всех стадий
FROM node:24-alpine AS base

# Установка системных зависимостей
RUN apk add --no-cache \
    libc6-compat \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Стадия установки зависимостей
FROM base AS deps
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем production зависимости с оптимизацией
# Игнорируем prepare скрипт (husky) в production
RUN npm ci --only=production --no-audit --no-fund --prefer-offline --ignore-scripts && \
    npm cache clean --force

# Стадия сборки
FROM base AS builder
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Устанавливаем все зависимости с оптимизацией
# Игнорируем prepare скрипт (husky) в production сборке
RUN npm ci --no-audit --no-fund --prefer-offline --ignore-scripts

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент (необходимо после игнорирования скриптов)
RUN npx prisma generate

# Устанавливаем переменные окружения для сборки
ENV NEXTAUTH_SECRET="docker-build-secret-key-for-production-build-32-chars"
ENV NEXTAUTH_URL="https://rolled-metal.example.com"
ENV DATABASE_URL="postgresql://user:password@localhost:5432/rolled_metal"
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1

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
ENV PORT=3000

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/shared/api/database/prisma ./src/shared/api/database/prisma

# Копируем только production зависимости
COPY --from=deps /app/node_modules ./node_modules

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app

# Переключаемся на non-root пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Настраиваем health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl --fail http://127.0.0.1:3000/api/health || exit 1

# Запускаем приложение с dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
