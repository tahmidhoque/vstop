import { PrismaClient } from '../src/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function backfillOrderNumbers() {
  console.log('Starting order number backfill...')
  
  // Get all orders ordered by creation date
  const orders = await db.order.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, orderNumber: true },
  })
  
  console.log(`Found ${orders.length} orders to backfill`)
  
  let orderNum = 1
  for (const order of orders) {
    // Skip if already has an order number
    if (order.orderNumber) {
      console.log(`Order ${order.id} already has order number: ${order.orderNumber}`)
      // Extract the number to continue the sequence
      const existingNum = parseInt(order.orderNumber.replace('ORD-', ''), 10)
      if (!isNaN(existingNum) && existingNum >= orderNum) {
        orderNum = existingNum + 1
      }
      continue
    }
    
    const orderNumber = `ORD-${String(orderNum).padStart(6, '0')}`
    
    try {
      await db.order.update({
        where: { id: order.id },
        data: { orderNumber },
      })
      console.log(`Updated order ${order.id} with order number: ${orderNumber}`)
      orderNum++
    } catch (error) {
      console.error(`Failed to update order ${order.id}:`, error)
    }
  }
  
  console.log('Backfill complete!')
  await db.$disconnect()
  process.exit(0)
}

backfillOrderNumbers().catch(async (error) => {
  console.error('Backfill failed:', error)
  await db.$disconnect()
  process.exit(1)
})

