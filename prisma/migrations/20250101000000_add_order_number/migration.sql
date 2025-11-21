-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- Backfill existing orders with order numbers
-- Generate order numbers based on creation date (ORD-000001, ORD-000002, etc.)
DO $$
DECLARE
    order_rec RECORD;
    order_num INTEGER := 1;
BEGIN
    FOR order_rec IN 
        SELECT id FROM "Order" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "Order" 
        SET "orderNumber" = 'ORD-' || LPAD(order_num::TEXT, 6, '0')
        WHERE id = order_rec.id;
        order_num := order_num + 1;
    END LOOP;
END $$;

-- Make orderNumber NOT NULL after backfilling
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

