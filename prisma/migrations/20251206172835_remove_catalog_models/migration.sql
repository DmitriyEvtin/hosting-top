/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category_sites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_sites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."category_sites" DROP CONSTRAINT "category_sites_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."category_sites" DROP CONSTRAINT "category_sites_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_images" DROP CONSTRAINT "product_images_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_sites" DROP CONSTRAINT "product_sites_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_sites" DROP CONSTRAINT "product_sites_siteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."category_sites";

-- DropTable
DROP TABLE "public"."cities";

-- DropTable
DROP TABLE "public"."product_images";

-- DropTable
DROP TABLE "public"."product_sites";

-- DropTable
DROP TABLE "public"."products";

-- DropTable
DROP TABLE "public"."sites";
