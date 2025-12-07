-- AlterTable
ALTER TABLE "hostings" ADD COLUMN     "clients" INTEGER,
ADD COLUMN     "start_year" TEXT,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "test_period" INTEGER DEFAULT 0;
