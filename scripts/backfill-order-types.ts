import "dotenv/config";
import { PrismaClient } from "../src/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL pool and adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Backfill script to set orderType for existing orders
 * - Orders with replacementForReturns relation → REPLACEMENT
 * - All other orders → CUSTOMER
 */
async function backfillOrderTypes() {
  console.log("Starting order type backfill...");

  // Get all orders with their replacement relations
  const orders = await prisma.order.findMany({
    include: {
      replacementForReturns: true,
    },
  });

  console.log(`Found ${orders.length} orders to process`);

  let replacementCount = 0;
  let customerCount = 0;

  for (const order of orders) {
    const isReplacement = order.replacementForReturns.length > 0;
    const orderType = isReplacement ? "REPLACEMENT" : "CUSTOMER";

    await prisma.order.update({
      where: { id: order.id },
      data: { orderType },
    });

    if (isReplacement) {
      replacementCount++;
    } else {
      customerCount++;
    }
  }

  console.log(`Backfill complete!`);
  console.log(`- ${customerCount} orders set to CUSTOMER`);
  console.log(`- ${replacementCount} orders set to REPLACEMENT`);

  await prisma.$disconnect();
  await pool.end();
}

backfillOrderTypes()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
