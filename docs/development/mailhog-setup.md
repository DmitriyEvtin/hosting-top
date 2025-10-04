# Настройка MailHog для тестирования Email

## Обзор

MailHog - это инструмент для тестирования email в development окружении. Он перехватывает все исходящие письма и отображает их в веб-интерфейсе, что позволяет тестировать email функциональность без отправки реальных писем.

## Установка и запуск

### 1. Запуск MailHog через Docker Compose

MailHog уже настроен в `docker-compose.yml`:

```yaml
mailer:
  image: mailhog/mailhog
  container_name: rolled-metal-mailhog
  restart: unless-stopped
  ports:
    - "1025:1025" # SMTP порт
    - "8025:8025" # Web UI порт
  networks:
    - rolled-metal-network
```

Запустите MailHog:

```bash
# Запуск только MailHog
docker-compose up mailer -d

# Или запуск всех сервисов
docker-compose up -d
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` с настройками для MailHog:

```bash
# Email настройки для MailHog
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@rolled-metal.local"
```

### 3. Проверка работы

1. **Web UI MailHog:** http://localhost:8025
2. **SMTP порт:** localhost:1025
3. **Приложение:** http://localhost:3000

## Использование

### 1. Тестирование через админ панель

1. Перейдите в админ панель: http://localhost:3000/admin
2. Нажмите на карточку "Тестирование Email"
3. Введите тестовый email (например: `test@example.com`)
4. Отправьте тестовое письмо
5. Проверьте письмо в MailHog UI: http://localhost:8025

### 2. Тестирование API напрямую

```bash
# Отправка простого письма
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Тестовое письмо",
    "text": "Текст письма",
    "html": "<p>HTML письма</p>"
  }'

# Отправка по шаблону
curl -X POST http://localhost:3000/api/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "template": "welcome",
    "to": "test@example.com",
    "data": {
      "userName": "Тестовый пользователь",
      "loginUrl": "http://localhost:3000/auth/signin"
    }
  }'
```

### 3. Проверка статуса email сервиса

```bash
curl http://localhost:3000/api/email/status
```

Ответ:

```json
{
  "configured": true,
  "smtpAvailable": true,
  "status": "ready"
}
```

## Доступные шаблоны для тестирования

### 1. Welcome (приветственное письмо)

```json
{
  "template": "welcome",
  "to": "user@example.com",
  "data": {
    "userName": "Имя пользователя",
    "loginUrl": "http://localhost:3000/auth/signin"
  }
}
```

### 2. Password Reset (сброс пароля)

```json
{
  "template": "passwordReset",
  "to": "user@example.com",
  "data": {
    "resetLink": "http://localhost:3000/auth/reset-password?token=abc123"
  }
}
```

### 3. User Created (уведомление о создании пользователя)

```json
{
  "template": "userCreated",
  "to": "admin@example.com",
  "data": {
    "userName": "Новый пользователь",
    "userEmail": "newuser@example.com",
    "userRole": "USER"
  }
}
```

### 4. User Updated (уведомление об обновлении профиля)

```json
{
  "template": "userUpdated",
  "to": "user@example.com",
  "data": {
    "userName": "Пользователь",
    "profileUrl": "http://localhost:3000/profile"
  }
}
```

## Автоматическое тестирование

### 1. Создание пользователя

При создании пользователя через админ панель автоматически отправляется приветственное письмо:

1. Перейдите в `/admin/users`
2. Создайте нового пользователя
3. Проверьте MailHog UI - должно прийти приветственное письмо

### 2. Тестирование всех шаблонов

Используйте компонент тестирования в админ панели для отправки всех доступных шаблонов.

## Troubleshooting

### 1. MailHog не запускается

```bash
# Проверьте статус контейнера
docker ps | grep mailhog

# Посмотрите логи
docker logs rolled-metal-mailhog

# Перезапустите контейнер
docker-compose restart mailer
```

### 2. Письма не доходят в MailHog

1. **Проверьте переменные окружения:**

   ```bash
   echo $SMTP_HOST
   echo $SMTP_PORT
   ```

2. **Проверьте подключение к MailHog:**

   ```bash
   telnet localhost 1025
   ```

3. **Проверьте логи приложения:**
   ```bash
   npm run dev
   # Ищите ошибки в консоли
   ```

### 3. MailHog UI недоступен

1. **Проверьте порт 8025:**

   ```bash
   curl http://localhost:8025
   ```

2. **Проверьте, что контейнер запущен:**
   ```bash
   docker ps | grep 8025
   ```

### 4. Ошибки SMTP

Если видите ошибки типа "Connection refused":

1. Убедитесь, что MailHog запущен
2. Проверьте, что порт 1025 доступен
3. Убедитесь, что переменные окружения настроены правильно

## Полезные команды

### Управление MailHog

```bash
# Запуск MailHog
docker-compose up mailer -d

# Остановка MailHog
docker-compose stop mailer

# Перезапуск MailHog
docker-compose restart mailer

# Просмотр логов MailHog
docker logs rolled-metal-mailhog -f

# Очистка писем в MailHog
curl -X DELETE http://localhost:8025/api/v1/messages
```

### Проверка конфигурации

```bash
# Проверка переменных окружения
npm run config:check

# Проверка email конфигурации
curl http://localhost:3000/api/email/status
```

## Интеграция с CI/CD

Для автоматического тестирования в CI/CD можно использовать MailHog:

```yaml
# .github/workflows/test.yml
- name: Start MailHog
  run: |
    docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

- name: Test Email
  run: |
    # Ваши тесты email функциональности
    npm run test:email
```

## Альтернативы MailHog

Если MailHog не подходит, можно использовать:

1. **Mailtrap** - облачный сервис для тестирования email
2. **MailCatcher** - альтернатива MailHog
3. **FakeSMTP** - простой SMTP сервер для тестирования

## Производственное окружение

⚠️ **Важно:** MailHog предназначен только для development. В production используйте реальные SMTP провайдеры:

- Gmail SMTP
- SendGrid
- Mailgun
- Amazon SES
- Yandex SMTP
- Mail.ru SMTP

## Мониторинг

### Логи MailHog

```bash
# Просмотр логов в реальном времени
docker logs rolled-metal-mailhog -f

# Просмотр последних 100 строк
docker logs rolled-metal-mailhog --tail 100
```

### Метрики

MailHog предоставляет API для получения метрик:

```bash
# Количество писем
curl http://localhost:8025/api/v1/messages

# Статистика
curl http://localhost:8025/api/v1/stats
```

## Безопасность

1. **Не используйте MailHog в production**
2. **Ограничьте доступ к порту 8025** в production
3. **Используйте HTTPS** для production email сервисов
4. **Настройте аутентификацию** для production SMTP

## Заключение

MailHog - отличный инструмент для тестирования email функциональности в development окружении. Он позволяет:

- ✅ Тестировать отправку писем без реальных SMTP серверов
- ✅ Просматривать содержимое писем в удобном веб-интерфейсе
- ✅ Тестировать различные шаблоны и форматы писем
- ✅ Отлаживать проблемы с email функциональностью
- ✅ Автоматизировать тестирование email в CI/CD

Используйте MailHog для development, но обязательно переходите на реальные SMTP провайдеры в production!
