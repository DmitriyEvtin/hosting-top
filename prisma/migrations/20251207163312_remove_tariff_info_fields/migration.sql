-- Remove info fields from tariffs table
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_disk_area";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_platforms";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_panels";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_price";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_ozu";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_cpu";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_cpu_core";
ALTER TABLE "tariffs" DROP COLUMN IF EXISTS "info_domains";

