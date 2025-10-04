# Переменные окружения
REGISTRY ?= localhost
IMAGE_NAME ?= rolled_metal
TAG ?= latest
ENVIRONMENT ?= development

# Development команды
dev:
	docker compose up -d
	npm run dev

dev-down:
	docker compose down

# MinIO команды
minio-up:
	docker compose up -d minio

minio-down:
	docker compose stop minio

minio-restart:
	docker compose restart minio

minio-logs:
	docker compose logs -f minio

minio-setup:
	npm run minio:setup

minio-status:
	@echo "🔍 Проверка статуса MinIO..."
	@curl -f http://localhost:9000/minio/health/live || echo "❌ MinIO недоступен"
	@echo "📊 MinIO Console: http://localhost:9001"
	@echo "🔗 MinIO API: http://localhost:9000"

minio-console:
	@echo "🌐 Открытие MinIO Console..."
	@echo "URL: http://localhost:9001"
	@echo "Логин: minioadmin"
	@echo "Пароль: minioadmin123"
	@open http://localhost:9001 || echo "Откройте http://localhost:9001 в браузере"

# MailHog команды
mailhog-up:
	docker compose up -d mailer

mailhog-down:
	docker compose stop mailer

mailhog-logs:
	docker logs rolled-metal-mailhog -f

mailhog-clear:
	curl -X DELETE http://localhost:8025/api/v1/messages

mailhog-status:
	curl -s http://localhost:8025/api/v1/stats | jq .

# Email тестирование
test-email:
	curl -X POST http://localhost:3000/api/email/send \
		-H "Content-Type: application/json" \
		-d '{"to":"test@example.com","subject":"Test","text":"Test message"}'

test-email-status:
	curl http://localhost:3000/api/email/status

# Production команды
prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-restart:
	docker compose -f docker-compose.prod.yml restart

# Production переменные окружения
prod-env-check:
	@echo "Проверка production переменных окружения..."
	@if [ ! -f .env.production ]; then \
		echo "❌ Файл .env.production не найден"; \
		echo "📋 Скопируйте env.production.example в .env.production и заполните переменные"; \
		exit 1; \
	fi
	@echo "✅ Файл .env.production найден"
	@echo "🔍 Проверка обязательных переменных..."
	@source .env.production && \
		[ -n "$$NEXTAUTH_SECRET" ] && echo "✅ NEXTAUTH_SECRET установлен" || echo "❌ NEXTAUTH_SECRET не установлен"; \
		[ -n "$$NEXTAUTH_URL" ] && echo "✅ NEXTAUTH_URL установлен" || echo "❌ NEXTAUTH_URL не установлен"; \
		[ -n "$$POSTGRES_PASSWORD" ] && echo "✅ POSTGRES_PASSWORD установлен" || echo "❌ POSTGRES_PASSWORD не установлен"; \
		[ -n "$$AWS_ACCESS_KEY_ID" ] && echo "✅ AWS_ACCESS_KEY_ID установлен" || echo "❌ AWS_ACCESS_KEY_ID не установлен"; \
		[ -n "$$AWS_SECRET_ACCESS_KEY" ] && echo "✅ AWS_SECRET_ACCESS_KEY установлен" || echo "❌ AWS_SECRET_ACCESS_KEY не установлен"; \
		[ -n "$$AWS_S3_BUCKET" ] && echo "✅ AWS_S3_BUCKET установлен" || echo "❌ AWS_S3_BUCKET не установлен"

prod-env-setup:
	@echo "📋 Настройка production переменных окружения..."
	@if [ ! -f .env.production ]; then \
		cp env.production.example .env.production; \
		echo "✅ Создан файл .env.production на основе env.production.example"; \
		echo "⚠️  Не забудьте заполнить все переменные в .env.production"; \
	else \
		echo "ℹ️  Файл .env.production уже существует"; \
	fi

prod-oauth-check:
	@echo "🔍 Проверка OAuth переменных..."
	@source .env.production && \
		echo "Google OAuth: $$([ -n "$$GOOGLE_CLIENT_ID" ] && echo "✅" || echo "❌")"; \
		echo "GitHub OAuth: $$([ -n "$$GITHUB_CLIENT_ID" ] && echo "✅" || echo "❌")"; \
		echo "VK OAuth: $$([ -n "$$VK_CLIENT_ID" ] && echo "✅" || echo "❌")"; \
		echo "OK OAuth: $$([ -n "$$OK_CLIENT_ID" ] && echo "✅" || echo "❌")"; \
		echo "Mail OAuth: $$([ -n "$$MAIL_CLIENT_ID" ] && echo "✅" || echo "❌")"; \
		echo "Yandex OAuth: $$([ -n "$$YANDEX_CLIENT_ID" ] && echo "✅" || echo "❌")"

# Docker build команды
build: build-app build-nginx

build-app:
	docker build --pull --file=docker/production/node/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-app:${TAG} .

build-nginx:
	docker build --pull --file=docker/production/nginx/Dockerfile --tag=${REGISTRY}/${IMAGE_NAME}-nginx:${TAG} .

# Docker push команды
push: push-app push-nginx

push-app:
	docker push ${REGISTRY}/${IMAGE_NAME}-app:${TAG}

push-nginx:
	docker push ${REGISTRY}/${IMAGE_NAME}-nginx:${TAG}

# Тестирование
test:
	npm run test:all

test-docker:
	docker compose -f docker-compose.prod.yml up -d
	sleep 30
	curl -f http://localhost/health || exit 1

# Sentry диагностика
sentry-check:
	@echo "🔍 Проверка конфигурации Sentry..."
	@node scripts/check-sentry-connection.js

sentry-test:
	@echo "🧪 Тестирование Sentry API..."
	@curl -X GET http://localhost:3000/api/sentry-diagnosis || echo "❌ API недоступен"

sentry-test-error:
	@echo "🚨 Тестирование отправки ошибки в Sentry..."
	@curl -X GET http://localhost:3000/api/sentry-test || echo "❌ API недоступен"

sentry-test-message:
	@echo "📝 Тестирование отправки сообщения в Sentry..."
	@curl -X POST http://localhost:3000/api/sentry-diagnosis \
		-H "Content-Type: application/json" \
		-d '{"message": "Тестовое сообщение из Makefile"}' || echo "❌ API недоступен"

sentry-test-full:
	@echo "🧪 Полное тестирование Sentry..."
	@node scripts/test-sentry.js

# Проверка конфигурации
check-sentry:
	node scripts/check-sentry.js

check-config:
	node scripts/check-config.js
	docker compose -f docker-compose.prod.yml down

check-env:
	node scripts/check-production-env.js

check-all:
	npm run config:validate
	npm run env:validate

# Очистка
clean:
	docker system prune -f
	docker volume prune -f

clean-all:
	docker system prune -a -f
	docker volume prune -f

# Мониторинг
logs:
	docker compose -f docker-compose.prod.yml logs -f

logs-app:
	docker compose -f docker-compose.prod.yml logs -f app

logs-nginx:
	docker compose -f docker-compose.prod.yml logs -f nginx

# Traefik логи
traefik-logs:
	./scripts/traefik-logs.sh --access --tail 50

traefik-logs-follow:
	./scripts/traefik-logs.sh --access --follow

traefik-logs-error:
	./scripts/traefik-logs.sh --error --tail 100

traefik-logs-stats:
	./scripts/traefik-logs.sh --stats

traefik-logs-clear:
	./scripts/traefik-logs.sh --clear

# Мониторинг стек
monitoring-up:
	docker compose -f docker-compose.monitoring.yml up -d

monitoring-down:
	docker compose -f docker-compose.monitoring.yml down

monitoring-logs:
	docker compose -f docker-compose.monitoring.yml logs -f

# Grafana
grafana:
	@echo "Grafana доступен по адресу: http://localhost:3001"
	@echo "Логин: admin, Пароль: admin123"

# GoAccess
goaccess:
	@echo "GoAccess доступен по адресу: http://localhost:7890"

# Health checks
health:
	curl -f http://localhost/health

health-api:
	curl -f http://localhost/api/health

# База данных
db-migrate:
	docker compose -f docker-compose.prod.yml up migrations

db-migrate-only:
	docker compose -f docker-compose.prod.yml run --rm migrations npx prisma migrate deploy

db-seed:
	docker compose -f docker-compose.prod.yml exec app npx prisma db seed

db-reset:
	docker compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force

db-check:
	docker compose -f docker-compose.prod.yml exec app node scripts/check-database-migrations.js

db-fix:
	docker compose -f docker-compose.prod.yml exec app node scripts/check-database-migrations.js

db-status:
	docker compose -f docker-compose.prod.yml exec app npx prisma migrate status

db-logs:
	docker compose -f docker-compose.prod.yml logs migrations

# Docker Registry
registry-up:
	docker compose -f docker-compose.registry.yml up -d

registry-down:
	docker compose -f docker-compose.registry.yml down

registry-logs:
	docker compose -f docker-compose.registry.yml logs -f

registry-status:
	@echo "Проверка статуса Docker Registry..."
	@curl -f http://localhost/v2/ -H "Host: registry.evtin.ru" || echo "Registry недоступен"

registry-login:
	@echo "Логин в Docker Registry..."
	@docker login registry.evtin.ru

registry-push: build
	@echo "Отправка образов в Registry..."
	@docker tag ${REGISTRY}/${IMAGE_NAME}-app:${TAG} registry.evtin.ru/${IMAGE_NAME}-app:${TAG}
	@docker tag ${REGISTRY}/${IMAGE_NAME}-nginx:${TAG} registry.evtin.ru/${IMAGE_NAME}-nginx:${TAG}
	@docker push registry.evtin.ru/${IMAGE_NAME}-app:${TAG}
	@docker push registry.evtin.ru/${IMAGE_NAME}-nginx:${TAG}

registry-pull:
	@echo "Загрузка образов из Registry..."
	@docker pull registry.evtin.ru/${IMAGE_NAME}-app:${TAG}
	@docker pull registry.evtin.ru/${IMAGE_NAME}-nginx:${TAG}

# Помощь
help:
	@echo "Доступные команды:"
	@echo "  dev          - Запуск development окружения"
	@echo "  dev-down     - Остановка development окружения"
	@echo "  minio-up     - Запуск MinIO"
	@echo "  minio-down   - Остановка MinIO"
	@echo "  minio-setup  - Настройка MinIO bucket"
	@echo "  minio-status - Проверка статуса MinIO"
	@echo "  minio-console - Открытие MinIO Console"
	@echo "  prod-up      - Запуск production окружения"
	@echo "  prod-down    - Остановка production окружения"
	@echo "  prod-restart - Перезапуск production окружения"
	@echo "  build        - Сборка Docker образов"
	@echo "  push         - Отправка образов в registry"
	@echo "  test         - Запуск тестов"
	@echo "  test-docker  - Тестирование Docker окружения"
	@echo "  check-config - Проверка конфигурации"
	@echo "  check-env    - Проверка переменных окружения"
	@echo "  check-all    - Полная проверка конфигурации"
	@echo "  clean        - Очистка Docker системы"
	@echo "  logs         - Просмотр логов"
	@echo "  traefik-logs - Просмотр логов Traefik"
	@echo "  monitoring-up - Запуск мониторинг стека"
	@echo "  grafana      - Информация о Grafana"
	@echo "  goaccess     - Информация о GoAccess"
	@echo "  health      - Проверка здоровья системы"
	@echo "  db-migrate   - Запуск сервиса миграций"
	@echo "  db-migrate-only - Только применение миграций"
	@echo "  db-seed      - Заполнение базы данных"
	@echo "  db-check     - Проверка состояния базы данных"
	@echo "  db-fix      - Исправление проблем с базой данных"
	@echo "  db-status    - Статус миграций"
	@echo "  db-logs      - Логи миграций"
	@echo "  registry-up  - Запуск Docker Registry"
	@echo "  registry-down - Остановка Docker Registry"
	@echo "  registry-logs - Просмотр логов Registry"
	@echo "  registry-status - Проверка статуса Registry"
	@echo "  registry-login - Логин в Registry"
	@echo "  registry-push - Отправка образов в Registry"
	@echo "  registry-pull - Загрузка образов из Registry"
	@echo "  db-reset     - Сброс базы данных"