# Docker Registry Configuration

## Обзор

Docker Registry настроен для работы через Traefik с доменом `registry.evtin.ru`. Это позволяет централизованно хранить Docker образы для проекта.

## Архитектура

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Docker CLI    │────│    Traefik   │────│  Docker Registry│
│                 │    │              │    │                 │
│ registry.evtin.ru│    │  SSL/TLS     │    │   Port 5000     │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## Настройка

### 1. Создание внешних ресурсов

```bash
# Создание внешней сети Traefik (если не создана)
docker network create traefik-public

# Создание внешнего volume для Registry
docker volume create registry
```

### 2. Настройка переменных окружения

Добавьте в `.env` файл:

```env
# Docker Registry
REGISTRY_URL=registry.evtin.ru
IMAGE_NAME=rolled_metal
IMAGE_TAG=latest

# Аутентификация Registry (опционально)
REGISTRY_AUTH_USERS=admin:$$2y$$10$$...
```

### 3. Генерация пароля для аутентификации

```bash
# Установка htpasswd (если не установлен)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd

# Генерация пароля
echo $(htpasswd -nb admin your_password) | sed -e s/\\$/\\$\\$/g

# Результат добавить в REGISTRY_AUTH_USERS
```

### 4. Запуск Registry

```bash
# Запуск Registry
make registry-up

# Проверка статуса
make registry-status

# Просмотр логов
make registry-logs
```

## Использование

### 1. Логин в Registry

```bash
# Логин в registry
make registry-login

# Или напрямую
docker login registry.evtin.ru
```

### 2. Работа с образами

```bash
# Сборка образов
make build

# Отправка образов в Registry
make registry-push

# Загрузка образов из Registry
make registry-pull
```

### 3. Ручная работа с образами

```bash
# Тегирование образа
docker tag myapp:latest registry.evtin.ru/myapp:latest

# Отправка образа
docker push registry.evtin.ru/myapp:latest

# Загрузка образа
docker pull registry.evtin.ru/myapp:latest
```

## Мониторинг

### 1. Проверка статуса

```bash
# Проверка доступности Registry
curl -f https://registry.evtin.ru/v2/

# Проверка каталога образов
curl -f https://registry.evtin.ru/v2/_catalog
```

### 2. Логи Registry

```bash
# Просмотр логов
make registry-logs

# Просмотр логов с фильтрацией
docker logs docker-registry | grep ERROR
```

### 3. Мониторинг через Traefik Dashboard

Registry будет отображаться в Traefik Dashboard по адресу:
`https://traefik.evtin.ru`

## Безопасность

### 1. Аутентификация

Registry поддерживает basic authentication через переменную `REGISTRY_AUTH_USERS`.

### 2. SSL/TLS

- Автоматические SSL-сертификаты от Let's Encrypt
- Принудительное перенаправление HTTP → HTTPS
- Security headers через Traefik middleware

### 3. CORS настройки

Registry настроен с CORS headers для работы с веб-интерфейсами:

```yaml
REGISTRY_HTTP_HEADERS_Access-Control-Allow-Origin: "*"
REGISTRY_HTTP_HEADERS_Access-Control-Allow-Methods: "HEAD, GET, OPTIONS, DELETE"
REGISTRY_HTTP_HEADERS_Access-Control-Allow-Headers: "Authorization, Accept, Content-Type"
```

## Управление данными

### 1. Резервное копирование

```bash
# Создание бэкапа Registry данных
docker run --rm -v registry:/data -v $(pwd):/backup alpine tar czf /backup/registry-backup.tar.gz -C /data .

# Восстановление из бэкапа
docker run --rm -v registry:/data -v $(pwd):/backup alpine tar xzf /backup/registry-backup.tar.gz -C /data
```

### 2. Очистка старых образов

```bash
# Просмотр размера Registry
docker exec docker-registry du -sh /var/lib/registry

# Очистка неиспользуемых слоев (осторожно!)
docker exec docker-registry registry garbage-collect /etc/docker/registry/config.yml
```

## Troubleshooting

### 1. Проблемы с подключением

```bash
# Проверка сети
docker network ls | grep traefik-public

# Проверка контейнера Registry
docker ps | grep registry

# Проверка логов
docker logs docker-registry
```

### 2. Проблемы с SSL

```bash
# Проверка сертификатов Traefik
docker exec traefik ls -la /certs/

# Проверка SSL соединения
openssl s_client -connect registry.evtin.ru:443 -servername registry.evtin.ru
```

### 3. Проблемы с аутентификацией

```bash
# Проверка переменных окружения
docker exec docker-registry env | grep REGISTRY

# Тест аутентификации
curl -u admin:password https://registry.evtin.ru/v2/
```

## Интеграция с CI/CD

### 1. GitHub Actions

```yaml
- name: Login to Registry
  run: |
    echo ${{ secrets.REGISTRY_PASSWORD }} | docker login registry.evtin.ru -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin

- name: Push to Registry
  run: |
    docker push registry.evtin.ru/rolled_metal-app:latest
```

### 2. Переменные окружения для CI/CD

```env
REGISTRY_USERNAME=admin
REGISTRY_PASSWORD=your_password
REGISTRY_URL=registry.evtin.ru
```

## Производительность

### 1. Настройка хранения

Registry использует файловую систему для хранения. Для production рекомендуется:

- Использование SSD дисков
- Настройка RAID для отказоустойчивости
- Регулярная очистка неиспользуемых образов

### 2. Мониторинг производительности

```bash
# Мониторинг использования диска
docker exec docker-registry df -h

# Мониторинг памяти
docker stats docker-registry
```

## Обновление

```bash
# Остановка Registry
make registry-down

# Обновление образа
docker pull registry:3

# Запуск обновленного Registry
make registry-up
```

## Резервное копирование

### 1. Автоматическое резервное копирование

```bash
#!/bin/bash
# backup-registry.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/registry"
REGISTRY_VOLUME="registry"

# Создание бэкапа
docker run --rm -v $REGISTRY_VOLUME:/data -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/registry-backup-$DATE.tar.gz -C /data .

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "registry-backup-*.tar.gz" -mtime +30 -delete
```

### 2. Восстановление

```bash
#!/bin/bash
# restore-registry.sh

BACKUP_FILE=$1
REGISTRY_VOLUME="registry"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Остановка Registry
make registry-down

# Восстановление данных
docker run --rm -v $REGISTRY_VOLUME:/data -v $(pwd):/backup alpine \
  tar xzf /backup/$BACKUP_FILE -C /data

# Запуск Registry
make registry-up
```

## Заключение

Docker Registry через Traefik обеспечивает:

- ✅ Безопасный доступ через HTTPS
- ✅ Автоматические SSL-сертификаты
- ✅ Централизованное хранение образов
- ✅ Интеграция с CI/CD
- ✅ Мониторинг и логирование
- ✅ Резервное копирование
