-- CreateEnum
CREATE TYPE "TariffPeriod" AS ENUM ('MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "hostings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" TEXT NOT NULL,
    "hosting_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "period" "TariffPeriod" NOT NULL,
    "disk_space" INTEGER,
    "bandwidth" INTEGER,
    "domains_count" INTEGER,
    "databases_count" INTEGER,
    "email_accounts" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "cms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_panels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "control_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "data_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_systems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "operation_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programming_languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "programming_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_cms" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "cms_id" TEXT NOT NULL,

    CONSTRAINT "tariff_cms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_control_panels" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "control_panel_id" TEXT NOT NULL,

    CONSTRAINT "tariff_control_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_countries" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,

    CONSTRAINT "tariff_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_data_stores" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "data_store_id" TEXT NOT NULL,

    CONSTRAINT "tariff_data_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_operation_systems" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "operation_system_id" TEXT NOT NULL,

    CONSTRAINT "tariff_operation_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_programming_languages" (
    "id" TEXT NOT NULL,
    "tariff_id" TEXT NOT NULL,
    "programming_language_id" TEXT NOT NULL,

    CONSTRAINT "tariff_programming_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hostings_slug_key" ON "hostings"("slug");

-- CreateIndex
CREATE INDEX "hostings_is_active_idx" ON "hostings"("is_active");

-- CreateIndex
CREATE INDEX "tariffs_hosting_id_idx" ON "tariffs"("hosting_id");

-- CreateIndex
CREATE INDEX "tariffs_is_active_idx" ON "tariffs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "cms_slug_key" ON "cms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "control_panels_slug_key" ON "control_panels"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "countries_slug_key" ON "countries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "data_stores_slug_key" ON "data_stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "operation_systems_slug_key" ON "operation_systems"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "programming_languages_slug_key" ON "programming_languages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_cms_tariff_id_cms_id_key" ON "tariff_cms"("tariff_id", "cms_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_control_panels_tariff_id_control_panel_id_key" ON "tariff_control_panels"("tariff_id", "control_panel_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_countries_tariff_id_country_id_key" ON "tariff_countries"("tariff_id", "country_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_data_stores_tariff_id_data_store_id_key" ON "tariff_data_stores"("tariff_id", "data_store_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_operation_systems_tariff_id_operation_system_id_key" ON "tariff_operation_systems"("tariff_id", "operation_system_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_programming_languages_tariff_id_programming_language_key" ON "tariff_programming_languages"("tariff_id", "programming_language_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks"("key");

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_hosting_id_fkey" FOREIGN KEY ("hosting_id") REFERENCES "hostings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_cms" ADD CONSTRAINT "tariff_cms_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_cms" ADD CONSTRAINT "tariff_cms_cms_id_fkey" FOREIGN KEY ("cms_id") REFERENCES "cms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_control_panels" ADD CONSTRAINT "tariff_control_panels_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_control_panels" ADD CONSTRAINT "tariff_control_panels_control_panel_id_fkey" FOREIGN KEY ("control_panel_id") REFERENCES "control_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_countries" ADD CONSTRAINT "tariff_countries_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_countries" ADD CONSTRAINT "tariff_countries_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_data_stores" ADD CONSTRAINT "tariff_data_stores_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_data_stores" ADD CONSTRAINT "tariff_data_stores_data_store_id_fkey" FOREIGN KEY ("data_store_id") REFERENCES "data_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_operation_systems" ADD CONSTRAINT "tariff_operation_systems_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_operation_systems" ADD CONSTRAINT "tariff_operation_systems_operation_system_id_fkey" FOREIGN KEY ("operation_system_id") REFERENCES "operation_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_programming_languages" ADD CONSTRAINT "tariff_programming_languages_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff_programming_languages" ADD CONSTRAINT "tariff_programming_languages_programming_language_id_fkey" FOREIGN KEY ("programming_language_id") REFERENCES "programming_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
