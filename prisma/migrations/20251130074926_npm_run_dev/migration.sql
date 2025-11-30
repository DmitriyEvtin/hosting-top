/*
  Warnings:

  - You are about to drop the `dealers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `holdings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."dealers" DROP CONSTRAINT "dealers_cityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."dealers" DROP CONSTRAINT "dealers_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."dealers" DROP CONSTRAINT "dealers_holdingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."dealers" DROP CONSTRAINT "dealers_managerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."dealers" DROP CONSTRAINT "dealers_updatedById_fkey";

-- DropTable
DROP TABLE "public"."dealers";

-- DropTable
DROP TABLE "public"."holdings";

-- DropEnum
DROP TYPE "public"."DealerType";
