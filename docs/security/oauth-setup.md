# Настройка OAuth провайдеров

[← Назад к документации](../README.md)

## Обзор

Проект поддерживает авторизацию через следующие OAuth провайдеры:

- **Google** - международный провайдер
- **GitHub** - для разработчиков
- **VKontakte** - российская социальная сеть
- **Одноклассники** - российская социальная сеть
- **Mail.ru** - российский почтовый сервис
- **Yandex** - российский поисковик

## Настройка переменных окружения

Добавьте следующие переменные в ваш `.env` файл:

```bash
# Российские OAuth провайдеры
VK_CLIENT_ID="your_vk_client_id"
VK_CLIENT_SECRET="your_vk_client_secret"
OK_CLIENT_ID="your_ok_client_id"
OK_CLIENT_SECRET="your_ok_client_secret"
MAIL_CLIENT_ID="your_mail_client_id"
MAIL_CLIENT_SECRET="your_mail_client_secret"
YANDEX_CLIENT_ID="your_yandex_client_id"
YANDEX_CLIENT_SECRET="your_yandex_client_secret"
```

## Настройка VKontakte

### 1. Создание приложения

1. Перейдите на [VK Developers](https://vk.com/apps?act=manage)
2. Нажмите "Создать приложение"
3. Заполните форму:
   - **Название**: Название вашего приложения
   - **Тип**: Standalone-приложение
   - **Платформа**: Web-сайт
4. После создания получите `Application ID` и `Secure key`

### 2. Настройка приложения

1. В настройках приложения укажите:
   - **Базовый домен**: `yourdomain.com`
   - **Доверенный redirect URI**: `https://yourdomain.com/api/auth/callback/vk`
2. В разделе "Настройки" включите:
   - **Доступ к друзьям**: Не обязательно
   - **Доступ к email**: Обязательно
   - **Доступ к фото**: Не обязательно

### 3. Получение токенов

- `VK_CLIENT_ID` = Application ID
- `VK_CLIENT_SECRET` = Secure key

## Настройка Одноклассники

### 1. Создание приложения

1. Перейдите на [OK Developers](https://ok.ru/devaccess)
2. Нажмите "Создать приложение"
3. Заполните форму:
   - **Название**: Название вашего приложения
   - **Тип**: Web-приложение
4. После создания получите `Application ID` и `Application secret key`

### 2. Настройка приложения

1. В настройках приложения укажите:
   - **Сайт приложения**: `https://yourdomain.com`
   - **Redirect URI**: `https://yourdomain.com/api/auth/callback/ok`
2. В разделе "Права доступа" включите:
   - **VALUABLE_ACCESS**: Для получения email и базовой информации

### 3. Получение токенов

- `OK_CLIENT_ID` = Application ID
- `OK_CLIENT_SECRET` = Application secret key

## Настройка Mail.ru

### 1. Создание приложения

1. Перейдите на [Mail.ru для разработчиков](https://o2.mail.ru/app/)
2. Нажмите "Создать приложение"
3. Заполните форму:
   - **Название**: Название вашего приложения
   - **Тип**: Web-приложение
4. После создания получите `Client ID` и `Client Secret`

### 2. Настройка приложения

1. В настройках приложения укажите:
   - **Redirect URI**: `https://yourdomain.com/api/auth/callback/mail`
2. В разделе "Права доступа" включите:
   - **userinfo**: Для получения базовой информации пользователя

### 3. Получение токенов

- `MAIL_CLIENT_ID` = Client ID
- `MAIL_CLIENT_SECRET` = Client Secret

## Настройка Yandex

### 1. Создание приложения

1. Перейдите на [Yandex OAuth](https://oauth.yandex.ru/)
2. Нажмите "Создать приложение"
3. Заполните форму:
   - **Название**: Название вашего приложения
   - **Описание**: Описание приложения
   - **Платформы**: Web-сервисы
4. После создания получите `Client ID` и `Client Secret`

### 2. Настройка приложения

1. В настройках приложения укажите:
   - **Callback URI**: `https://yourdomain.com/api/auth/callback/yandex`
2. В разделе "Права доступа" включите:
   - **Доступ к адресу электронной почты**: Включено
   - **Доступ к имени, фамилии, полу и дате рождения**: Включено

### 3. Получение токенов

- `YANDEX_CLIENT_ID` = Client ID
- `YANDEX_CLIENT_SECRET` = Client Secret

## Тестирование OAuth

### 1. Локальное тестирование

Для локального тестирования используйте ngrok или аналогичный сервис:

```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 3000

# Используйте полученный URL в настройках OAuth приложений
# Например: https://abc123.ngrok.io
```

### 2. Проверка работы

1. Запустите приложение: `npm run dev`
2. Перейдите на `/auth/signin`
3. Попробуйте войти через каждый провайдер
4. Проверьте, что пользователь создается в базе данных

## Безопасность

### 1. Защита секретов

- Никогда не коммитьте `.env` файлы в репозиторий
- Используйте разные приложения для development и production
- Регулярно обновляйте секреты

### 2. Настройки CORS

Убедитесь, что в настройках OAuth приложений указаны правильные домены:

```bash
# Development
https://localhost:3000
https://your-ngrok-url.ngrok.io

# Production
https://yourdomain.com
https://www.yourdomain.com
```

### 3. Логирование

Добавьте логирование для отслеживания OAuth ошибок:

```typescript
// В auth-config.ts
callbacks: {
  async signIn({ user, account, profile }) {
    console.log('OAuth sign in:', {
      provider: account?.provider,
      userId: user.id,
      email: user.email
    });
    return true;
  }
}
```

## Устранение неполадок

### Частые проблемы

1. **"Invalid redirect URI"**
   - Проверьте, что redirect URI точно совпадает с настройками в OAuth приложении
   - Убедитесь, что используется правильный протокол (http/https)

2. **"Client ID not found"**
   - Проверьте правильность CLIENT_ID в переменных окружения
   - Убедитесь, что приложение активировано

3. **"Invalid client secret"**
   - Проверьте правильность CLIENT_SECRET
   - Убедитесь, что секрет не содержит лишних пробелов

4. **"Access denied"**
   - Проверьте настройки прав доступа в OAuth приложении
   - Убедитесь, что пользователь дал согласие на доступ

### Логи для отладки

Включите подробное логирование:

```bash
# В .env
DEBUG=next-auth*
NEXTAUTH_DEBUG=true
```

## Мониторинг

### 1. Отслеживание ошибок

Настройте Sentry для отслеживания OAuth ошибок:

```typescript
// В auth-config.ts
callbacks: {
  async signIn({ user, account, profile }) {
    try {
      // OAuth логика
      return true;
    } catch (error) {
      console.error('OAuth error:', error);
      Sentry.captureException(error);
      return false;
    }
  }
}
```

### 2. Метрики

Отслеживайте:

- Количество успешных входов по провайдерам
- Количество ошибок по провайдерам
- Время ответа OAuth провайдеров

## Обновление провайдеров

### 1. Добавление нового провайдера

1. Создайте файл провайдера в `src/shared/lib/auth-providers/`
2. Добавьте провайдер в `auth-config.ts`
3. Обновите UI компоненты
4. Добавьте переменные окружения

### 2. Удаление провайдера

1. Удалите провайдер из `auth-config.ts`
2. Удалите переменные окружения
3. Обновите UI компоненты
4. Удалите файл провайдера

## Заключение

OAuth интеграция обеспечивает удобный вход для пользователей через популярные российские и международные сервисы. Следуйте инструкциям по настройке каждого провайдера и регулярно проверяйте работоспособность системы.
