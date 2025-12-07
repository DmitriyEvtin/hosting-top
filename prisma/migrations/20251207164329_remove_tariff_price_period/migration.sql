-- Remove price and period fields from tariffs table
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "price";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "period";

