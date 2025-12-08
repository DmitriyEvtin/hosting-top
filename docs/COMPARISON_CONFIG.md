# Конфигурация функции сравнения тарифов

Документация по переменным окружения для настройки функции сравнения тарифов хостинга.

## Обзор

Функция сравнения тарифов позволяет пользователям:
- Сравнивать несколько тарифов хостинга
- Сохранять сравнения для последующего просмотра
- Делиться ссылками на сравнения с другими пользователями

## Переменные окружения

### COMPARISON_LINK_EXPIRY_DAYS

**Описание:** Срок действия ссылок для шаринга сравнений (в днях).

**Тип:** Число (integer)

**Значение по умолчанию:** `30`

**Допустимые значения:** Положительное целое число (рекомендуется от 1 до 365)

**Примеры:**
```bash
# Ссылки действительны 30 дней
COMPARISON_LINK_EXPIRY_DAYS=30

# Ссылки действительны 7 дней
COMPARISON_LINK_EXPIRY_DAYS=7

# Ссылки действительны 90 дней
COMPARISON_LINK_EXPIRY_DAYS=90
```

**Использование:**
- Определяет, как долго будут действительны публичные ссылки на сравнения
- После истечения срока ссылка становится недействительной
- Используется при генерации токенов для шаринга

---

### MAX_SAVED_COMPARISONS_PER_USER

**Описание:** Максимальное количество сохраненных сравнений на одного пользователя.

**Тип:** Число (integer)

**Значение по умолчанию:** `10`

**Допустимые значения:** Положительное целое число (рекомендуется от 1 до 100)

**Примеры:**
```bash
# Лимит 10 сохраненных сравнений
MAX_SAVED_COMPARISONS_PER_USER=10

# Лимит 5 сохраненных сравнений
MAX_SAVED_COMPARISONS_PER_USER=5

# Лимит 20 сохраненных сравнений
MAX_SAVED_COMPARISONS_PER_USER=20
```

**Использование:**
- Ограничивает количество сравнений, которые пользователь может сохранить
- При достижении лимита пользователь должен удалить старое сравнение перед созданием нового
- Помогает управлять объемом данных в базе

---

### MAX_TARIFFS_IN_COMPARISON

**Описание:** Максимальное количество тарифов в одном сравнении.

**Тип:** Число (integer)

**Значение по умолчанию:** `5`

**Допустимые значения:** Положительное целое число (рекомендуется от 2 до 10)

**Примеры:**
```bash
# Максимум 5 тарифов в сравнении
MAX_TARIFFS_IN_COMPARISON=5

# Максимум 3 тарифа в сравнении
MAX_TARIFFS_IN_COMPARISON=3

# Максимум 10 тарифов в сравнении
MAX_TARIFFS_IN_COMPARISON=10
```

**Использование:**
- Ограничивает количество тарифов, которые можно добавить в одно сравнение
- Валидируется на клиенте и сервере при добавлении тарифов
- Влияет на производительность отображения таблицы сравнения

---

### NEXT_PUBLIC_APP_URL

**Описание:** Базовый URL приложения для формирования ссылок шаринга.

**Тип:** Строка (string)

**Значение по умолчанию:** `http://localhost:3000` (development), `https://hosting-top.ru` (production)

**Допустимые значения:** Валидный URL с протоколом (http:// или https://)

**Примеры:**
```bash
# Для разработки
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Для продакшена
NEXT_PUBLIC_APP_URL="https://hosting-top.ru"

# Для staging окружения
NEXT_PUBLIC_APP_URL="https://staging.hosting-top.ru"
```

**Использование:**
- Используется для генерации публичных ссылок на сравнения
- Должен соответствовать реальному домену приложения
- Переменная с префиксом `NEXT_PUBLIC_` доступна на клиенте

**Важно:**
- В production должен использовать HTTPS
- URL должен быть без завершающего слеша
- Используется в email-уведомлениях и ссылках шаринга

---

## Настройка для разных окружений

### Development (Разработка)

```bash
COMPARISON_LINK_EXPIRY_DAYS=30
MAX_SAVED_COMPARISONS_PER_USER=10
MAX_TARIFFS_IN_COMPARISON=5
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (Продакшен)

```bash
COMPARISON_LINK_EXPIRY_DAYS=30
MAX_SAVED_COMPARISONS_PER_USER=10
MAX_TARIFFS_IN_COMPARISON=5
NEXT_PUBLIC_APP_URL="https://hosting-top.ru"
```

### Staging (Тестовое окружение)

```bash
COMPARISON_LINK_EXPIRY_DAYS=7
MAX_SAVED_COMPARISONS_PER_USER=5
MAX_TARIFFS_IN_COMPARISON=5
NEXT_PUBLIC_APP_URL="https://staging.hosting-top.ru"
```

---

## Использование в коде

### Доступ через env-simple.ts

Все переменные доступны через объект `env` из `src/shared/lib/env-simple.ts`:

```typescript
import { env } from '@/shared/lib/env-simple';

// Срок действия ссылок
const expiryDays = env.COMPARISON_LINK_EXPIRY_DAYS; // 30

// Лимит сохраненных сравнений
const maxSaved = env.MAX_SAVED_COMPARISONS_PER_USER; // 10

// Максимум тарифов в сравнении
const maxTariffs = env.MAX_TARIFFS_IN_COMPARISON; // 5

// Базовый URL приложения
const appUrl = env.NEXT_PUBLIC_APP_URL; // http://localhost:3000
```

### Прямой доступ через process.env

Для переменных с префиксом `NEXT_PUBLIC_` можно использовать прямой доступ:

```typescript
// На клиенте и сервере
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Только на сервере
const expiryDays = process.env.COMPARISON_LINK_EXPIRY_DAYS;
```

---

## Рекомендации по настройке

### Для малых проектов
- `COMPARISON_LINK_EXPIRY_DAYS=7` - короткий срок действия ссылок
- `MAX_SAVED_COMPARISONS_PER_USER=5` - меньше сохраненных сравнений
- `MAX_TARIFFS_IN_COMPARISON=3` - меньше тарифов в сравнении

### Для средних проектов
- `COMPARISON_LINK_EXPIRY_DAYS=30` - стандартный срок
- `MAX_SAVED_COMPARISONS_PER_USER=10` - стандартный лимит
- `MAX_TARIFFS_IN_COMPARISON=5` - стандартное количество

### Для крупных проектов
- `COMPARISON_LINK_EXPIRY_DAYS=90` - длительный срок действия
- `MAX_SAVED_COMPARISONS_PER_USER=20` - больше сохраненных сравнений
- `MAX_TARIFFS_IN_COMPARISON=10` - больше тарифов в сравнении

---

## Валидация значений

При использовании переменных в коде рекомендуется валидировать значения:

```typescript
// Валидация с fallback значениями
const expiryDays = Math.max(1, Math.min(365, env.COMPARISON_LINK_EXPIRY_DAYS));
const maxSaved = Math.max(1, Math.min(100, env.MAX_SAVED_COMPARISONS_PER_USER));
const maxTariffs = Math.max(2, Math.min(10, env.MAX_TARIFFS_IN_COMPARISON));
```

---

## Миграция и обновление

При обновлении значений переменных:

1. Обновите `.env` файл в соответствующем окружении
2. Перезапустите приложение для применения изменений
3. Существующие ссылки будут использовать старые значения до истечения срока
4. Новые сравнения будут использовать обновленные значения

---

## Связанная документация

- [Архитектура приложения](./architecture.md)
- [Документация API сравнения](./API_COMPARISON.md) (если существует)

---

## Поддержка

При возникновении проблем с конфигурацией:
1. Проверьте значения переменных в `.env` файле
2. Убедитесь, что приложение перезапущено после изменений
3. Проверьте логи приложения на наличие ошибок валидации

