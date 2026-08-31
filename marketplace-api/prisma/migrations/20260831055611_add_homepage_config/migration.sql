-- CreateEnum
CREATE TYPE "HomepageLinkType" AS ENUM ('CATEGORY', 'BRAND');

-- CreateTable
CREATE TABLE "HomepageLink" (
    "id" TEXT NOT NULL,
    "type" "HomepageLinkType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroImageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageLink_order_idx" ON "HomepageLink"("order");

-- AddForeignKey
ALTER TABLE "HomepageLink" ADD CONSTRAINT "HomepageLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageLink" ADD CONSTRAINT "HomepageLink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
