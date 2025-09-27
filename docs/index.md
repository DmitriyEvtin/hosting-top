# Техническая документация: Каталог металлопроката с парсингом данных

## Обзор проекта

Система каталога металлопроката с автоматическим парсингом данных с сайта bvb-alyans.ru, админ-панелью для управления товарами и интеграцией с AWS S3 для хранения изображений.

### Основные возможности
- Автоматический парсинг каталога товаров с bvb-alyans.ru
- Админ-панель для управления товарами и категориями
- Хранение изображений в AWS S3
- Современный UI/UX с Tailwind CSS
- Архитектура Feature-Sliced Design (FSD)

## Технический стек

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL, Prisma ORM
- **Cloud Storage**: AWS S3
- **Architecture**: Feature-Sliced Design (FSD)
- **Parsing**: Puppeteer, Cheerio
- **Testing**: Jest, React Testing Library, Playwright

## Система парсинга данных

### Архитектура парсера
- **BvbAlyansParser** - Основной класс для парсинга данных с сайта bvb-alyans.ru
- **CategoryParser** - Парсинг категорий товаров
- **ProductParser** - Парсинг списка товаров из категории
- **ProductDetailsParser** - Парсинг детальной информации о товаре
- **ImageDownloader** - Скачивание и обработка изображений

### Обработка изображений
- **S3ImageService** - Загрузка изображений в AWS S3
- **ImageOptimizer** - Оптимизация изображений перед загрузкой
- **ThumbnailGenerator** - Генерация миниатюр разных размеров

## Конфигурация сервисов

### Environment Variables
- **DATABASE_URL** - Строка подключения к PostgreSQL
- **NEXTAUTH_SECRET** - Секретный ключ для аутентификации
- **NEXTAUTH_URL** - URL приложения
- **AWS_ACCESS_KEY_ID** - AWS ключ доступа
- **AWS_SECRET_ACCESS_KEY** - AWS секретный ключ
- **AWS_S3_BUCKET** - Имя S3 bucket для изображений
- **AWS_REGION** - Регион AWS
- **PARSING_BATCH_SIZE** - Размер батча для парсинга
- **PARSING_DELAY_MS** - Задержка между запросами
- **MAX_CONCURRENT_REQUESTS** - Максимальное количество одновременных запросов

### Next.js Configuration
- Настройка для работы с Puppeteer
- Конфигурация доменов для изображений
- Webpack конфигурация для внешних пакетов

### Prisma Configuration
- Singleton паттерн для Prisma клиента
- Логирование запросов в development
- Глобальная конфигурация для разных окружений

## Мониторинг и логирование

### Система логирования
- **Logger** - Централизованная система логирования
- **ParsingLogger** - Специализированное логирование для парсинга
- **ErrorLogger** - Логирование ошибок и исключений

### Мониторинг парсинга
- **ParsingStore** - Хранение состояния процесса парсинга
- **ProgressTracker** - Отслеживание прогресса парсинга
- **ErrorCollector** - Сбор и анализ ошибок парсинга

## Безопасность

### Аутентификация
- **NextAuth.js** - Система аутентификации
- **CredentialsProvider** - Аутентификация по email/password
- **Session Management** - Управление сессиями пользователей
- **Role-based Access** - Контроль доступа на основе ролей

### Валидация данных
- **Zod Schemas** - Схемы валидации для всех форм
- **Input Sanitization** - Очистка пользовательского ввода
- **Type Safety** - Строгая типизация для предотвращения ошибок

## Производительность

### Оптимизация изображений
- **ImageOptimizer** - Оптимизация изображений с помощью Sharp
- **ThumbnailGenerator** - Генерация миниатюр разных размеров
- **WebP Conversion** - Конвертация в современные форматы
- **Lazy Loading** - Ленивая загрузка изображений

### Кэширование
- **Redis Cache** - Кэширование часто запрашиваемых данных
- **Query Caching** - Кэширование результатов запросов к БД
- **Static Generation** - Статическая генерация страниц каталога
- **CDN Integration** - Интеграция с CDN для статических ресурсов

## Тестирование

### Unit тесты
- **Jest** - Фреймворк для unit тестирования
- **React Testing Library** - Тестирование React компонентов
- **Prisma Testing** - Тестирование работы с базой данных
- **API Testing** - Тестирование API endpoints

### E2E тесты
- **Playwright** - End-to-end тестирование пользовательских сценариев
- **Catalog Navigation** - Тестирование навигации по каталогу
- **Admin Panel** - Тестирование функциональности админ-панели
- **Parsing Workflow** - Тестирование процесса парсинга данных

## Деплой и CI/CD

### Docker Configuration
- **Multi-stage Build** - Оптимизированная сборка Docker образа
- **Node.js Alpine** - Легковесный базовый образ
- **Production Dependencies** - Установка только production зависимостей
- **Health Checks** - Проверка состояния контейнера

### Docker Structure
```
docker/
├── production/
│   ├── nginx/
│   │   └── Dockerfile
│   └── node/
│       └── Dockerfile
├── common/
│   └── nginx/
│       └── conf.d/
│           └── default.conf
└── development/
    └── nginx/
        └── Dockerfile
```

### GitHub Actions
- **Automated Testing** - Автоматический запуск тестов
- **Build Process** - Автоматическая сборка приложения
- **Docker Hub Push** - Пуш Docker образа в Docker Hub после успешных тестов

### Makefile
- **Deploy Commands** - Команды для деплоя будут реализованы в Makefile
- **Environment Management** - Управление различными окружениями
- **Database Operations** - Команды для работы с базой данных
- **Service Management** - Управление сервисами приложения

### Docker Compose для разработки
- **PostgreSQL Database** - Локальная база данных для разработки
- **MinIO/MinIO** - S3-совместимое хранилище файлов для разработки
- **MailHog/MailHog** - Локальный SMTP сервер для тестирования почты
- **Development Environment** - Полная среда разработки в Docker

### Production Deployment
- **Portainer CE** - Развертывание на production через Portainer CE
- **Traefik** - Основной прокси-сервер для маршрутизации и SSL
- **Docker Stack** - Управление сервисами через Docker Swarm
- **Load Balancing** - Балансировка нагрузки между инстансами
