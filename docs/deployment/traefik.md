# Traefik Configuration Guide

## Обзор

Traefik - это современный reverse proxy и load balancer, который автоматически обнаруживает сервисы и управляет SSL-сертификатами.

## Основные улучшения в конфигурации

### 1. Безопасность

- ✅ Использование TLS challenge вместо HTTP challenge
- ✅ Расширенные security headers
- ✅ Rate limiting
- ✅ HTTPS redirect
- ✅ Dashboard с аутентификацией

### 2. Мониторинг и логирование

- ✅ Dashboard Traefik на порту 8080
- ✅ Подробное логирование
- ✅ Access logs
- ✅ Health checks

### 3. Управление сертификатами

- ✅ Автоматическое получение SSL-сертификатов от Let's Encrypt
- ✅ Автоматическое обновление сертификатов
- ✅ Хранение сертификатов в Docker volume

## Настройка

### 1. Создание внешней сети

```bash
docker network create traefik-public
docker network create parket-crm-network
```

### 2. Настройка переменных окружения

Скопируйте `env.traefik.example` в `env.traefik.prod` и настройте:

```bash
cp env.traefik.example env.traefik.prod
```

Отредактируйте `env.traefik.prod`:

```env
ACME_EMAIL=evtin@yandex.ru
DOMAIN=parket-crm.ru
```

### 3. Быстрое развертывание с доменом parket-crm.ru

Используйте готовый скрипт для развертывания:

```bash
# Запуск автоматического развертывания
./scripts/deploy-traefik.sh
```

### 4. Ручной запуск

```bash
# Загрузка переменных окружения
export $(cat env.traefik.prod | xargs)

# Запуск полного стека с Traefik
docker-compose -f docker-compose.traefik.prod.yml up -d
```

### 5. Проверка развертывания

```bash
# Проверка статуса сервисов
docker-compose -f docker-compose.traefik.prod.yml ps

# Проверка логов
docker-compose -f docker-compose.traefik.prod.yml logs -f

# Проверка доступности
curl -I https://parket-crm.ru
```

### 6. Настройка DNS для parket-crm.ru

Для корректной работы с доменом parket-crm.ru необходимо настроить DNS записи:

#### A-записи

```
parket-crm.ru        A    YOUR_SERVER_IP
traefik.parket-crm.ru A   YOUR_SERVER_IP
```

#### CNAME-записи (альтернативно)

```
parket-crm.ru        CNAME   your-server.example.com
traefik.parket-crm.ru CNAME  your-server.example.com
```

#### Проверка DNS

```bash
# Проверка A-записи
nslookup parket-crm.ru

# Проверка с помощью dig
dig parket-crm.ru

# Проверка доступности
ping parket-crm.ru
```

## Использование с приложением

### 1. Добавление лейблов к сервисам

Для подключения сервиса к Traefik добавьте следующие лейблы:

```yaml
services:
  app:
    # ... другие настройки
    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=Host(`app.${DOMAIN}`)
      - traefik.http.routers.app.entrypoints=https
      - traefik.http.routers.app.tls.certresolver=letsencrypt
      - traefik.http.routers.app.middlewares=secure-headers,rate-limit
      - traefik.http.services.app.loadbalancer.server.port=3000
    networks:
      - traefik-public
```

### 2. Docker Registry через Traefik

Docker Registry настроен для работы через Traefik с доменом `registry.evtin.ru`:

```yaml
services:
  registry:
    image: registry:3
    container_name: docker-registry
    restart: unless-stopped
    environment:
      REGISTRY_HTTP_HOST: registry.evtin.ru
      REGISTRY_HTTP_ADDR: 0.0.0.0:5000
    networks:
      - traefik-public
    labels:
      - traefik.enable=true
      - traefik.http.routers.registry.rule=Host(`registry.evtin.ru`)
      - traefik.http.routers.registry.entrypoints=https
      - traefik.http.routers.registry.tls.certresolver=letsencrypt
      - traefik.http.services.registry.loadbalancer.server.port=5000
```

#### Настройка аутентификации для Registry

Для защиты Docker Registry добавьте переменную окружения:

```bash
# Генерация пароля для аутентификации
echo $(htpasswd -nb admin password) | sed -e s/\\$/\\$\\$/g

# Добавьте в .env файл
REGISTRY_AUTH_USERS=admin:$$2y$$10$$...
```

#### Использование Registry

```bash
# Логин в registry
docker login registry.evtin.ru

# Тегирование и пуш образа
docker tag myapp:latest registry.evtin.ru/myapp:latest
docker push registry.evtin.ru/myapp:latest

# Пул образа
docker pull registry.evtin.ru/myapp:latest
```

### 2. Middleware для безопасности

Доступные middleware:

- `secure-headers` - Security headers
- `rate-limit` - Rate limiting
- `redirect-to-https` - HTTP to HTTPS redirect

### 3. Dashboard Traefik

Dashboard доступен по адресу: `https://traefik.yourdomain.com`

## Мониторинг

### Логи Traefik

```bash
# Основные логи
docker logs traefik

# Access logs
docker exec traefik cat /var/log/traefik/access.log

# Логи ошибок
docker exec traefik cat /var/log/traefik/traefik.log
```

### Health Check

```bash
# Проверка состояния
docker exec traefik traefik healthcheck --ping
```

## Troubleshooting

### 1. Проблемы с SSL-сертификатами

```bash
# Проверка сертификатов
docker exec traefik ls -la /certs/

# Очистка сертификатов (осторожно!)
docker volume rm traefik-public-certs
```

### 2. Проблемы с сетью

```bash
# Проверка сети
docker network ls | grep traefik

# Создание сети заново
docker network rm traefik-public
docker network create traefik-public
```

### 3. Проблемы с конфигурацией

```bash
# Проверка конфигурации
docker exec traefik traefik version
docker exec traefik traefik config
```

## Безопасность

### 1. Dashboard аутентификация

Для защиты dashboard добавьте basic auth:

```yaml
labels:
  - traefik.http.routers.traefik.middlewares=traefik-auth
  - traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$2y$$10$$...
```

### 2. Ограничение доступа

```yaml
labels:
  - traefik.http.routers.traefik.middlewares=traefik-whitelist
  - traefik.http.middlewares.traefik-whitelist.ipwhitelist.sourcerange=192.168.1.0/24
```

## Производительность

### 1. Настройка rate limiting

```yaml
labels:
  - traefik.http.middlewares.rate-limit.ratelimit.average=100
  - traefik.http.middlewares.rate-limit.ratelimit.burst=200
```

### 2. Кэширование

```yaml
labels:
  - traefik.http.middlewares.cache.headers.customRequestHeaders.Cache-Control=max-age=3600
```

## Интеграция с Docker Swarm

Для использования в Docker Swarm замените `deploy` секцию:

```yaml
deploy:
  replicas: 1
  placement:
    constraints:
      - node.role == manager
  labels:
    - traefik.enable=true
    - traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN}`)
    - traefik.http.routers.traefik.entrypoints=https
    - traefik.http.routers.traefik.tls.certresolver=letsencrypt
    - traefik.http.routers.traefik.service=api@internal
```

## Обновление

```bash
# Остановка
docker-compose -f docker-compose.traefik.yml down

# Обновление образа
docker-compose -f docker-compose.traefik.yml pull

# Запуск
docker-compose -f docker-compose.traefik.yml up -d
```

## Резервное копирование

```bash
# Бэкап сертификатов
docker run --rm -v traefik-public-certs:/data -v $(pwd):/backup alpine tar czf /backup/traefik-certs-backup.tar.gz -C /data .

# Восстановление сертификатов
docker run --rm -v traefik-public-certs:/data -v $(pwd):/backup alpine tar xzf /backup/traefik-certs-backup.tar.gz -C /data
```
