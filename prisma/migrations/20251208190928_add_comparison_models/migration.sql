-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tariff_ids" TEXT[],
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_comparisons" (
    "id" TEXT NOT NULL,
    "share_id" VARCHAR(12) NOT NULL,
    "tariff_ids" TEXT[],
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comparisons_user_id_idx" ON "comparisons"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_comparisons_share_id_key" ON "shared_comparisons"("share_id");

-- CreateIndex
CREATE INDEX "shared_comparisons_share_id_idx" ON "shared_comparisons"("share_id");

-- CreateIndex
CREATE INDEX "shared_comparisons_expires_at_idx" ON "shared_comparisons"("expires_at");

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
