# Настройка Email сервиса

## Обзор

В проекте реализована полная система отправки email уведомлений с использованием nodemailer. Система поддерживает:

- Отправку простых email сообщений
- Отправку по шаблонам с подстановкой данных
- Автоматическую отправку приветственных писем при создании пользователей
- Тестирование email сервиса через админ панель

## Переменные окружения

### Development (с MailHog)

Для локальной разработки используйте MailHog:

```bash
# Email (MailHog для development)
SMTP_HOST="localhost"                # MailHog хост
SMTP_PORT="1025"                     # MailHog порт
SMTP_USER=""                         # Не требуется для MailHog
SMTP_PASSWORD=""                     # Не требуется для MailHog
SMTP_FROM="noreply@rolled-metal.local"  # Email отправителя
```

### Production (реальный SMTP)

Для production используйте реальный SMTP провайдер:

```bash
# Email (реальный SMTP для production)
SMTP_HOST="smtp.gmail.com"           # SMTP сервер
SMTP_PORT="587"                       # SMTP порт (587 для TLS, 465 для SSL)
SMTP_USER="your-email@gmail.com"     # Email пользователь
SMTP_PASSWORD="your-app-password"     # Пароль приложения
SMTP_FROM="noreply@yourdomain.com"    # Email отправителя
```

## Настройка популярных провайдеров

### Gmail

1. Включите двухфакторную аутентификацию в Google аккаунте
2. Создайте пароль приложения:
   - Перейдите в настройки Google аккаунта
   - Безопасность → Пароли приложений
   - Создайте новый пароль для приложения
3. Используйте этот пароль в `SMTP_PASSWORD`

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-character-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Yandex

```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT="587"
SMTP_USER="your-email@yandex.ru"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Mail.ru

```bash
SMTP_HOST="smtp.mail.ru"
SMTP_PORT="587"
SMTP_USER="your-email@mail.ru"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@yourdomain.com"
```

### SendGrid

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
```

## Архитектура Email сервиса

### Структура файлов

```
src/shared/api/email/
├── types.ts          # Типы для email сервиса
├── client.ts         # Email клиент с nodemailer
├── templates.ts      # Email шаблоны
└── index.ts          # Экспорты

src/shared/lib/
└── use-email.ts      # React хук для работы с email

src/app/api/email/
├── send/route.ts     # API для отправки простого email
├── template/route.ts # API для отправки по шаблону
└── status/route.ts   # API для проверки статуса

src/views/admin/email/
└── ui/EmailTest/     # Компонент тестирования email
```

### Email сервис

Основной сервис находится в `src/shared/api/email/client.ts`:

```typescript
import { emailService } from "@/shared/api/email";

// Отправка простого email
await emailService.sendEmail({
  to: "user@example.com",
  subject: "Тема письма",
  text: "Текст письма",
  html: "<p>HTML письма</p>",
});

// Отправка по шаблону
await emailService.sendTemplate("welcome", "user@example.com", {
  userName: "Имя пользователя",
});
```

### React хук

Используйте хук `useEmail` в React компонентах:

```typescript
import { useEmail } from '@/shared/lib/use-email';

function MyComponent() {
  const { sendEmail, sendTemplate, isLoading, error, isConfigured } = useEmail();

  const handleSendEmail = async () => {
    try {
      await sendEmail({
        to: 'user@example.com',
        subject: 'Тема',
        text: 'Текст',
      });
    } catch (err) {
      console.error('Ошибка отправки:', err);
    }
  };

  return (
    <div>
      {!isConfigured && <p>Email сервис не настроен</p>}
      <button onClick={handleSendEmail} disabled={isLoading}>
        {isLoading ? 'Отправка...' : 'Отправить'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

## Доступные шаблоны

### welcome

Приветственное письмо для новых пользователей.

**Плейсхолдеры:**

- `{userName}` - имя пользователя
- `{loginUrl}` - ссылка для входа

### passwordReset

Письмо для сброса пароля.

**Плейсхолдеры:**

- `{resetLink}` - ссылка для сброса пароля

### userCreated

Уведомление администратора о создании пользователя.

**Плейсхолдеры:**

- `{userName}` - имя пользователя
- `{userEmail}` - email пользователя
- `{userRole}` - роль пользователя

### userUpdated

Уведомление пользователя об обновлении профиля.

**Плейсхолдеры:**

- `{userName}` - имя пользователя
- `{profileUrl}` - ссылка на профиль

## API Endpoints

### POST /api/email/send

Отправка простого email.

**Тело запроса:**

```json
{
  "to": "user@example.com",
  "subject": "Тема письма",
  "text": "Текст письма",
  "html": "<p>HTML письма</p>",
  "from": "sender@example.com" // опционально
}
```

### POST /api/email/template

Отправка email по шаблону.

**Тело запроса:**

```json
{
  "template": "welcome",
  "to": "user@example.com",
  "data": {
    "userName": "Имя пользователя",
    "loginUrl": "https://example.com/login"
  }
}
```

### GET /api/email/status

Проверка статуса email сервиса.

**Ответ:**

```json
{
  "configured": true,
  "smtpAvailable": true,
  "status": "ready"
}
```

## Тестирование

### Через админ панель

1. Перейдите в админ панель: `/admin`
2. Нажмите на карточку "Тестирование Email"
3. Введите email для тестирования
4. Отправьте тестовое письмо или выберите шаблон

### Программное тестирование

```typescript
// Проверка статуса
const response = await fetch("/api/email/status");
const status = await response.json();
console.log("Email сервис настроен:", status.configured);

// Отправка тестового письма
await fetch("/api/email/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "test@example.com",
    subject: "Тест",
    text: "Тестовое сообщение",
  }),
});
```

## Интеграция с созданием пользователей

При создании нового пользователя через API `/api/admin/users` автоматически отправляется приветственное письмо (если email сервис настроен).

```typescript
// В src/app/api/admin/users/route.ts
if (hasSmtp) {
  try {
    const welcomeTemplate = renderTemplate(emailTemplates.welcome, {
      userName: user.name,
      loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
    });

    await emailService.sendEmail({
      to: user.email,
      ...welcomeTemplate,
    });
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
    // Не прерываем создание пользователя из-за ошибки email
  }
}
```

## Troubleshooting

### Ошибка "Email service is not configured"

1. Проверьте переменные окружения:

   ```bash
   echo $SMTP_HOST
   echo $SMTP_USER
   echo $SMTP_PASSWORD
   ```

2. Убедитесь, что все переменные установлены в `.env` файле

3. Перезапустите приложение после изменения переменных

### Ошибка аутентификации SMTP

1. **Gmail**: Используйте пароль приложения, не обычный пароль
2. **Yandex**: Включите "Доступ по протоколу IMAP" в настройках
3. **Mail.ru**: Включите "Доступ по протоколу IMAP" в настройках

### Письма не доходят

1. Проверьте папку "Спам"
2. Убедитесь, что домен отправителя не заблокирован
3. Проверьте логи сервера на наличие ошибок

### Медленная отправка

1. Используйте SMTP провайдера с хорошей репутацией (SendGrid, Mailgun)
2. Настройте очереди для отправки email в фоне
3. Используйте connection pooling

## Безопасность

1. **Никогда не храните пароли в коде** - используйте переменные окружения
2. **Используйте пароли приложений** для Gmail и других сервисов
3. **Ограничьте доступ** к SMTP настройкам только администраторам
4. **Логируйте отправку** email для аудита
5. **Валидируйте email адреса** перед отправкой

## Мониторинг

### Логирование

Все ошибки отправки email логируются в консоль:

```typescript
console.error("Failed to send email:", error);
```

### Метрики

Можно добавить метрики для отслеживания:

- Количество отправленных писем
- Время отправки
- Процент успешных отправок
- Ошибки по типам

### Алерты

Настройте алерты на:

- Ошибки отправки email
- Превышение лимитов SMTP
- Недоступность email сервиса

## Производительность

### Оптимизация

1. **Connection pooling** - переиспользуйте SMTP соединения
2. **Асинхронная отправка** - не блокируйте основной поток
3. **Очереди** - используйте Redis или базу данных для очередей
4. **Batch отправка** - группируйте письма для отправки

### Пример с очередью

```typescript
// Добавление в очередь
await redis.lpush(
  "email-queue",
  JSON.stringify({
    to: "user@example.com",
    subject: "Welcome",
    template: "welcome",
    data: { userName: "John" },
  })
);

// Обработка очереди (отдельный процесс)
while (true) {
  const emailData = await redis.brpop("email-queue", 0);
  if (emailData) {
    await emailService.sendTemplate(
      emailData.template,
      emailData.to,
      emailData.data
    );
  }
}
```

## Расширение функциональности

### Новые шаблоны

Добавьте новые шаблоны в `src/shared/api/email/templates.ts`:

```typescript
export const emailTemplates: Record<string, EmailTemplate> = {
  // ... существующие шаблоны

  newsletter: {
    subject: "Новости - {companyName}",
    text: "Добро пожаловать в нашу рассылку!",
    html: "<h1>Добро пожаловать!</h1><p>Спасибо за подписку на рассылку {companyName}.</p>",
  },
};
```

### Кастомные провайдеры

Создайте кастомный email провайдер:

```typescript
// src/shared/api/email/providers/custom.ts
export class CustomEmailProvider implements EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    // Ваша логика отправки
  }
}
```

### Webhook уведомления

Добавьте webhook для уведомлений о статусе отправки:

```typescript
// src/app/api/email/webhook/route.ts
export async function POST(request: NextRequest) {
  const { event, messageId, status } = await request.json();

  // Обработка webhook от email провайдера
  if (status === "delivered") {
    // Обновить статус в базе данных
  }
}
```
