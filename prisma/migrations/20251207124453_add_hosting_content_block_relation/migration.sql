-- CreateTable
CREATE TABLE "hosting_content_blocks" (
    "id" TEXT NOT NULL,
    "hosting_id" TEXT NOT NULL,
    "content_block_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hosting_content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hosting_content_blocks_hosting_id_idx" ON "hosting_content_blocks"("hosting_id");

-- CreateIndex
CREATE INDEX "hosting_content_blocks_content_block_id_idx" ON "hosting_content_blocks"("content_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "hosting_content_blocks_hosting_id_content_block_id_key" ON "hosting_content_blocks"("hosting_id", "content_block_id");

-- AddForeignKey
ALTER TABLE "hosting_content_blocks" ADD CONSTRAINT "hosting_content_blocks_hosting_id_fkey" FOREIGN KEY ("hosting_id") REFERENCES "hostings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_content_blocks" ADD CONSTRAINT "hosting_content_blocks_content_block_id_fkey" FOREIGN KEY ("content_block_id") REFERENCES "content_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
