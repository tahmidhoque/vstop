'use client'

import Link from 'next/link'
import OrderList from '@/components/admin/OrderList'
import type { OrderWithItems } from '@/types'

interface OrdersPageClientProps {
  orders: OrderWithItems[]
}

export default function OrdersPageClient({ orders }: OrdersPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <OrderList orders={orders} />
      </div>
    </div>
  )
}


