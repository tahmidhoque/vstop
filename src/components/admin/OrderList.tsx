'use client'

import { useState } from 'react'
import { OrderStatus } from '@/generated/enums'
import OrderEditModal from './OrderEditModal'
import {
  updateOrderStatus,
  updateOrder,
  deleteOrder,
} from '@/lib/actions'
import { formatDate } from '@/lib/date-utils'
import type { OrderWithItems } from '@/types'

interface OrderListProps {
  orders: OrderWithItems[]
}

export default function OrderList({ orders }: OrderListProps) {
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)

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

  const handleDelete = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      setDeletingOrderId(orderId)
      try {
        await deleteOrder(orderId)
        window.location.reload()
      } catch (error) {
        alert('Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setDeletingOrderId(null)
      }
    }
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
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
              filter === 'PENDING'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Pending ({orders.filter((o) => o.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('UNFULFILLED')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
              filter === 'UNFULFILLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Unfulfilled ({orders.filter((o) => o.status === 'UNFULFILLED').length})
          </button>
          <button
            onClick={() => setFilter('FULFILLED')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
              filter === 'FULFILLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Fulfilled ({orders.filter((o) => o.status === 'FULFILLED').length})
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
              filter === 'CANCELLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            Cancelled ({orders.filter((o) => o.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {order.username}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Order: <span className="font-mono font-medium">{order.orderNumber}</span> • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'UNFULFILLED'
                        ? 'bg-orange-100 text-orange-800'
                        : order.status === 'FULFILLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    £{totalValue(order).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Items:</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs sm:text-sm text-gray-600 gap-2"
                    >
                      <span className="flex-1 min-w-0 truncate">
                        {item.product.name}
                        {item.flavour && ` (${item.flavour})`} × {item.quantity}
                      </span>
                      <span className="flex-shrink-0">£{Number(item.priceAtTime).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleEdit(order)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'UNFULFILLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Mark Unfulfilled
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
                {order.status === 'UNFULFILLED' && (
                  <>
                    <button
                      onClick={() => handleEdit(order)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
                {order.status === 'FULFILLED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
                {order.status === 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, 'PENDING')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
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


