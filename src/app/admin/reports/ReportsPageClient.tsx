'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/lib/auth-actions'
import { getReportsData } from '@/lib/actions'
import { formatDate } from '@/lib/date-utils'
import type { OrderWithItems } from '@/types'

interface ReportsData {
  totalOrders: number
  cancelledOrders: number
  fulfilledOrders: number
  unfulfilledOrders: number
  totalSales: number
  orders: OrderWithItems[]
}

interface ReportsPageClientProps {
  initialData: ReportsData
  initialStartDate: Date
  initialEndDate: Date
}

export default function ReportsPageClient({
  initialData,
  initialStartDate,
  initialEndDate,
}: ReportsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reportsData, setReportsData] = useState<ReportsData>(initialData)
  const [startDate, setStartDate] = useState<string>(
    initialStartDate.toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    initialEndDate.toISOString().split('T')[0]
  )

  const handleLogout = async () => {
    await logoutAction()
    router.push('/admin/login')
    router.refresh()
  }

  const handleDateRangeChange = () => {
    startTransition(async () => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start > end) {
        alert('Start date must be before or equal to end date')
        return
      }

      const data = await getReportsData(start, end)
      setReportsData(data)
    })
  }

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`
  }

  const totalValue = (order: OrderWithItems) => {
    return order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                disabled={isPending}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                disabled={isPending}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDateRangeChange}
                disabled={isPending}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Loading...' : 'Update Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reportsData.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Cancelled Orders</h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{reportsData.cancelledOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Fulfilled Orders</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{reportsData.fulfilledOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Unfulfilled Orders</h3>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{reportsData.unfulfilledOrders}</p>
          </div>
        </div>

        {/* Total Sales Card - Prominently Displayed */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 sm:p-8 mb-4 sm:mb-8">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Sales</h3>
            <p className="text-3xl sm:text-5xl font-bold text-blue-600">{formatCurrency(reportsData.totalSales)}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Excluding cancelled orders
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Transactions</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {reportsData.orders.length} transaction{reportsData.orders.length !== 1 ? 's' : ''} in selected date range
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {reportsData.orders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions found in the selected date range</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {reportsData.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {order.username}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDate(order.createdAt)}
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
                          {formatCurrency(totalValue(order))}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
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
                            <span className="flex-shrink-0">{formatCurrency(Number(item.priceAtTime))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-4 sm:mt-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px] flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

