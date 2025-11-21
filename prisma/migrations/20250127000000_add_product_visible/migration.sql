-- AlterTable
ALTER TABLE "Product" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_visible_idx" ON "Product"("visible");

