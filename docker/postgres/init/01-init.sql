-- Инициализация базы данных для проекта "Каталог металлопроката"
-- Создание расширений для работы с JSON и полнотекстовым поиском

-- Включаем расширения для работы с JSON
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Создаем схему для приложения (опционально, можно использовать public)
-- CREATE SCHEMA IF NOT EXISTS rolled_metal;

-- Настройки для оптимизации производительности
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Перезагружаем конфигурацию
SELECT pg_reload_conf();
