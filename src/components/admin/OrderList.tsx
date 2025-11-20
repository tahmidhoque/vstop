'use client'

import { useState } from 'react'
import { OrderStatus } from '@prisma/client'
import OrderEditModal from './OrderEditModal'
import {
  updateOrderStatus,
  updateOrder,
} from '@/lib/actions'
import { formatDate } from '@/lib/date-utils'
import type { OrderWithItems } from '@/types'

interface OrderListProps {
  orders: OrderWithItems[]
}

export default function OrderList({ orders }: OrderListProps) {
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')

  const filteredOrders =
    filter === 'ALL'
      ? orders
      : orders.filter((order) => order.status === filter)

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status)
    window.location.reload()
  }

  const handleEdit = (order: OrderWithItems) => {
    setEditingOrder(order)
  }

  const handleEditSubmit = async () => {
    setEditingOrder(null)
    window.location.reload()
  }

  const totalValue = (order: OrderWithItems) => {
    return order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0
    )
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] ${
              filter === 'PENDING'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({orders.filter((o) => o.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('FULFILLED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] ${
              filter === 'FULFILLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fulfilled ({orders.filter((o) => o.status === 'FULFILLED').length})
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] ${
              filter === 'CANCELLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({orders.filter((o) => o.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.username}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'FULFILLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    £{totalValue(order).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {item.product.name}
                        {item.flavour && ` (${item.flavour})`} × {item.quantity}
                      </span>
                      <span>£{Number(item.priceAtTime).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleEdit(order)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === 'FULFILLED' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
                  >
                    Cancel
                  </button>
                )}
                {order.status === 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'PENDING')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSubmit}
        />
      )}
    </>
  )
}


