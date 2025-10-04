# Настройка OAuth в Production

[← Назад к документации](../README.md)

## Быстрый старт

### 1. Настройка переменных окружения

```bash
# Создайте файл production переменных
make prod-env-setup

# Проверьте обязательные переменные
make prod-env-check

# Проверьте OAuth переменные
make prod-oauth-check
```

### 2. Настройка OAuth провайдеров

Для каждого провайдера необходимо:

1. **Создать приложение** в соответствующем сервисе
2. **Получить Client ID и Client Secret**
3. **Настроить Redirect URI** для production домена
4. **Добавить переменные** в `.env.production`

#### Redirect URI для production

```
https://metal-works.pro/api/auth/callback/{provider}
```

Где `{provider}` - это один из:

- `google` - для Google
- `github` - для GitHub
- `vk` - для VKontakte
- `ok` - для Одноклассники
- `mail` - для Mail.ru
- `yandex` - для Yandex

### 3. Пример настройки

```bash
# В .env.production
NEXTAUTH_URL=https://metal-works.pro

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VK OAuth
VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret

# И так далее для всех провайдеров...
```

## Подробные инструкции

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте Redirect URI: `https://metal-works.pro/api/auth/callback/google`

### VKontakte OAuth

1. Перейдите на [VK Developers](https://vk.com/apps?act=manage)
2. Создайте новое приложение
3. В настройках укажите Redirect URI: `https://metal-works.pro/api/auth/callback/vk`
4. Включите доступ к email

### Одноклассники OAuth

1. Перейдите на [OK Developers](https://ok.ru/devaccess)
2. Создайте новое приложение
3. Укажите Redirect URI: `https://metal-works.pro/api/auth/callback/ok`
4. Включите права доступа VALUABLE_ACCESS

### Mail.ru OAuth

1. Перейдите на [Mail.ru для разработчиков](https://o2.mail.ru/app/)
2. Создайте новое приложение
3. Укажите Redirect URI: `https://metal-works.pro/api/auth/callback/mail`
4. Включите права доступа userinfo

### Yandex OAuth

1. Перейдите на [Yandex OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Укажите Callback URI: `https://metal-works.pro/api/auth/callback/yandex`
4. Включите доступ к email и базовой информации

## Проверка настройки

### 1. Проверка переменных

```bash
# Проверка всех переменных
make prod-env-check

# Проверка только OAuth
make prod-oauth-check
```

### 2. Тестирование в production

1. Запустите production окружение:

   ```bash
   make prod-up
   ```

2. Перейдите на `https://metal-works.pro/auth/signin`

3. Проверьте, что все OAuth кнопки отображаются

4. Протестируйте вход через каждый провайдер

### 3. Мониторинг

Проверьте логи приложения на наличие ошибок OAuth:

```bash
# Логи приложения
docker logs rolled-metal-app-prod -f

# Логи nginx
docker logs rolled-metal-nginx-prod -f
```

## Troubleshooting

### Частые проблемы

1. **"Invalid redirect URI"**
   - Проверьте, что Redirect URI точно совпадает с настройками в OAuth приложении
   - Убедитесь, что используется HTTPS

2. **"Client ID not found"**
   - Проверьте правильность CLIENT_ID в переменных окружения
   - Убедитесь, что приложение активировано

3. **"Access denied"**
   - Проверьте настройки прав доступа в OAuth приложении
   - Убедитесь, что пользователь дал согласие на доступ

### Логи для отладки

```bash
# Включите debug режим в .env.production
NEXTAUTH_DEBUG=true
DEBUG=next-auth*

# Перезапустите приложение
make prod-restart

# Проверьте логи
docker logs rolled-metal-app-prod -f
```

## Безопасность

### 1. Защита секретов

- Никогда не коммитьте `.env.production` файл
- Используйте разные приложения для development и production
- Регулярно обновляйте секреты

### 2. Настройки CORS

Убедитесь, что в настройках OAuth приложений указаны правильные домены:

```bash
# Production
https://metal-works.pro
https://www.metal-works.pro
```

### 3. Мониторинг

Настройте Sentry для отслеживания OAuth ошибок:

```bash
# В .env.production
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
```

## Заключение

После настройки всех OAuth провайдеров пользователи смогут входить в систему через:

- ✅ Google
- ✅ GitHub
- ✅ VKontakte
- ✅ Одноклассники
- ✅ Mail.ru
- ✅ Yandex

Все провайдеры настроены с правильными Redirect URI и правами доступа для production окружения.
