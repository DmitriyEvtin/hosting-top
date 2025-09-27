# API дизайн

[← Назад к документации](../README.md)

## REST API архитектура

API построен на принципах REST с четким разделением ресурсов и операций.

### Базовые принципы

#### URL структура
```
/api/v1/{resource}/{id?}/{sub-resource?}
```

#### HTTP методы
- **GET** - Получение данных
- **POST** - Создание ресурса
- **PUT** - Полное обновление ресурса
- **PATCH** - Частичное обновление ресурса
- **DELETE** - Удаление ресурса

#### Статус коды
- **200** - Успешный запрос
- **201** - Ресурс создан
- **400** - Неверный запрос
- **401** - Не авторизован
- **403** - Доступ запрещен
- **404** - Ресурс не найден
- **500** - Внутренняя ошибка сервера

## Endpoints для товаров

### Получение списка товаров
```http
GET /api/v1/products
```

#### Query параметры
- `page` - Номер страницы (по умолчанию 1)
- `limit` - Количество товаров на странице (по умолчанию 20)
- `category` - ID категории для фильтрации
- `search` - Поисковый запрос
- `sort` - Поле для сортировки (name, price, createdAt)
- `order` - Порядок сортировки (asc, desc)
- `minPrice` - Минимальная цена
- `maxPrice` - Максимальная цена

#### Пример запроса
```http
GET /api/v1/products?page=1&limit=20&category=123&search=труба&sort=price&order=asc
```

#### Ответ
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Труба стальная",
      "slug": "truba-stalnaya",
      "description": "Труба стальная для водопровода",
      "price": 1500.00,
      "currency": "RUB",
      "category": {
        "id": "cat_123",
        "name": "Трубы",
        "slug": "truby"
      },
      "images": [
        {
          "id": "img_123",
          "url": "https://s3.amazonaws.com/bucket/images/truba-1.jpg",
          "alt": "Труба стальная",
          "isMain": true
        }
      ],
      "attributes": [
        {
          "name": "Диаметр",
          "value": "50 мм",
          "unit": "мм"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Получение товара по ID
```http
GET /api/v1/products/{id}
```

#### Ответ
```json
{
  "data": {
    "id": "prod_123",
    "name": "Труба стальная",
    "slug": "truba-stalnaya",
    "description": "Подробное описание товара...",
    "price": 1500.00,
    "currency": "RUB",
    "category": {
      "id": "cat_123",
      "name": "Трубы",
      "slug": "truby"
    },
    "images": [...],
    "attributes": [...],
    "relatedProducts": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Создание товара
```http
POST /api/v1/products
```

#### Тело запроса
```json
{
  "name": "Новый товар",
  "description": "Описание товара",
  "price": 2000.00,
  "categoryId": "cat_123",
  "attributes": [
    {
      "name": "Материал",
      "value": "Сталь",
      "unit": null
    }
  ]
}
```

### Обновление товара
```http
PUT /api/v1/products/{id}
PATCH /api/v1/products/{id}
```

### Удаление товара
```http
DELETE /api/v1/products/{id}
```

## Endpoints для категорий

### Получение списка категорий
```http
GET /api/v1/categories
```

#### Query параметры
- `parent` - ID родительской категории (для получения подкатегорий)
- `tree` - Возврат в виде дерева (true/false)

#### Ответ
```json
{
  "data": [
    {
      "id": "cat_123",
      "name": "Трубы",
      "slug": "truby",
      "description": "Трубы стальные и пластиковые",
      "imageUrl": "https://s3.amazonaws.com/bucket/categories/truby.jpg",
      "parentId": null,
      "children": [
        {
          "id": "cat_124",
          "name": "Трубы стальные",
          "slug": "truby-stalnye",
          "parentId": "cat_123",
          "children": []
        }
      ],
      "productCount": 45,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Endpoints для парсинга

### Запуск парсинга
```http
POST /api/v1/parsing/start
```

#### Тело запроса
```json
{
  "type": "full", // full, incremental
  "categories": ["cat_123", "cat_124"], // опционально, для выборочного парсинга
  "options": {
    "batchSize": 50,
    "delayMs": 1000,
    "maxConcurrent": 5
  }
}
```

#### Ответ
```json
{
  "data": {
    "sessionId": "session_123",
    "status": "started",
    "startedAt": "2024-01-15T10:30:00Z",
    "estimatedDuration": "2h 30m"
  }
}
```

### Статус парсинга
```http
GET /api/v1/parsing/status/{sessionId}
```

#### Ответ
```json
{
  "data": {
    "sessionId": "session_123",
    "status": "running", // pending, running, completed, failed, cancelled
    "progress": {
      "total": 1000,
      "processed": 450,
      "percentage": 45
    },
    "statistics": {
      "productsFound": 450,
      "productsUpdated": 400,
      "productsCreated": 50,
      "errors": 5
    },
    "startedAt": "2024-01-15T10:30:00Z",
    "estimatedCompletion": "2024-01-15T13:00:00Z"
  }
}
```

### Остановка парсинга
```http
POST /api/v1/parsing/stop/{sessionId}
```

## Endpoints для аутентификации

### Вход в систему
```http
POST /api/v1/auth/login
```

#### Тело запроса
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Ответ
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "admin@example.com",
      "name": "Администратор",
      "role": "ADMIN"
    },
    "token": "jwt_token_here",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

### Обновление токена
```http
POST /api/v1/auth/refresh
```

### Выход из системы
```http
POST /api/v1/auth/logout
```

## Обработка ошибок

### Формат ошибки
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "details": [
      {
        "field": "name",
        "message": "Название товара обязательно"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123"
  }
}
```

### Коды ошибок
- **VALIDATION_ERROR** - Ошибка валидации
- **NOT_FOUND** - Ресурс не найден
- **UNAUTHORIZED** - Не авторизован
- **FORBIDDEN** - Доступ запрещен
- **RATE_LIMITED** - Превышен лимит запросов
- **INTERNAL_ERROR** - Внутренняя ошибка сервера

## Пагинация

### Стандартная пагинация
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Cursor пагинация (для больших наборов данных)
```json
{
  "pagination": {
    "cursor": "eyJpZCI6InByb2RfMTIzIn0=",
    "limit": 20,
    "hasNext": true
  }
}
```

## Фильтрация и поиск

### Полнотекстовый поиск
```http
GET /api/v1/products?search=труба стальная
```

### Фильтрация по атрибутам
```http
GET /api/v1/products?attributes[материал]=сталь&attributes[диаметр]=50
```

### Сложные фильтры
```http
GET /api/v1/products?filter[price][gte]=1000&filter[price][lte]=5000&filter[category][in]=cat_123,cat_124
```

## Кэширование

### HTTP заголовки кэширования
```http
Cache-Control: public, max-age=3600
ETag: "etag_value"
Last-Modified: Wed, 15 Jan 2024 10:30:00 GMT
```

### Условные запросы
```http
If-None-Match: "etag_value"
If-Modified-Since: Wed, 15 Jan 2024 10:30:00 GMT
```

## Rate Limiting

### Заголовки rate limiting
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

### Ошибка rate limiting
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Превышен лимит запросов",
    "retryAfter": 60
  }
}
```
