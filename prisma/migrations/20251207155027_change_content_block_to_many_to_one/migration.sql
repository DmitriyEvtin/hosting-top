-- Step 1: Add hosting_id column to content_blocks
ALTER TABLE "content_blocks" ADD COLUMN "hosting_id" TEXT;

-- Step 2: Migrate data from hosting_content_blocks to content_blocks
UPDATE "content_blocks" 
SET "hosting_id" = "hosting_content_blocks"."hosting_id"
FROM "hosting_content_blocks"
WHERE "content_blocks"."id" = "hosting_content_blocks"."content_block_id";

-- Step 3: Add foreign key constraint
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_hosting_id_fkey" FOREIGN KEY ("hosting_id") REFERENCES "hostings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Create index on hosting_id
CREATE INDEX "content_blocks_hosting_id_idx" ON "content_blocks"("hosting_id");

-- Step 5: Drop the intermediate table
DROP TABLE "hosting_content_blocks";

