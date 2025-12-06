-- Удаление таблиц каталога
-- Удаляем в правильном порядке, учитывая внешние ключи

-- Сначала удаляем таблицы с внешними ключами
DROP TABLE IF EXISTS "product_images" CASCADE;
DROP TABLE IF EXISTS "product_sites" CASCADE;
DROP TABLE IF EXISTS "category_sites" CASCADE;

-- Затем удаляем основные таблицы
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "sites" CASCADE;
DROP TABLE IF EXISTS "cities" CASCADE;