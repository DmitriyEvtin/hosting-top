# Переменные окружения
REGISTRY ?= localhost
IMAGE_NAME ?= rolled_metal
TAG ?= latest
ENVIRONMENT ?= development

# Development команды
dev:
	docker compose up -d postgres redis
	npm run dev

dev-down:
	docker compose down

# Production команды
prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-restart:
	docker compose -f docker-compose.prod.yml restart

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