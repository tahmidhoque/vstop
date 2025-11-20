'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/lib/auth-actions'
import { formatDate } from '@/lib/date-utils'
import type { OrderWithItems } from '@/types'

interface AdminDashboardClientProps {
  pendingOrders: number
  lowStockProducts: number
  recentOrders: OrderWithItems[]
}

export default function AdminDashboardClient({
  pendingOrders,
  lowStockProducts,
  recentOrders,
}: AdminDashboardClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAction()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Low Stock Products</h3>
            <p className="text-3xl font-bold text-orange-600">{lowStockProducts}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
            <p className="text-sm text-gray-600">Manage products and stock levels</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders</h3>
            <p className="text-sm text-gray-600">View and manage orders</p>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Change end user password</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{order.username}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
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
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recentOrders.length > 0 && (
              <div className="mt-6">
                <Link
                  href="/admin/orders"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all orders →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


