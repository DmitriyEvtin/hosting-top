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
	docker compose -f docker-compose.prod.yml down

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

# Health checks
health:
	curl -f http://localhost/health

health-api:
	curl -f http://localhost/api/health

# База данных
db-migrate:
	docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

db-seed:
	docker compose -f docker-compose.prod.yml exec app npx prisma db seed

db-reset:
	docker compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force

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
	@echo "  clean        - Очистка Docker системы"
	@echo "  logs         - Просмотр логов"
	@echo "  health       - Проверка здоровья системы"
	@echo "  db-migrate   - Применение миграций"
	@echo "  db-seed      - Заполнение базы данных"
	@echo "  db-reset     - Сброс базы данных"