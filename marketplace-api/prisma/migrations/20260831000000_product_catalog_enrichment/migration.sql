-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- AlterTable: OrderItem.totalPriceCents (added nullable, backfilled, then made required)
ALTER TABLE "OrderItem" ADD COLUMN     "totalPriceCents" INTEGER;

UPDATE "OrderItem" SET "totalPriceCents" = "unitPriceCents" * "quantity" WHERE "totalPriceCents" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "totalPriceCents" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- AlterTable: Product new columns (slug added nullable, backfilled, then made required)
ALTER TABLE "Product" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "compareAtPriceCents" INTEGER,
ADD COLUMN     "costPriceCents" INTEGER,
ADD COLUMN     "orderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "soldQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" "ProductVisibility" NOT NULL DEFAULT 'VISIBLE',
ADD COLUMN     "weight" DOUBLE PRECISION;

-- Backfill existing products with a slug derived from their title, disambiguated
-- with a short id suffix so the later per-shop unique constraint always succeeds.
UPDATE "Product"
SET "slug" = lower(
      regexp_replace(regexp_replace(trim("title"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')
    ) || '-' || substr("id", 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_slug_key" ON "Product"("shopId", "slug");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
