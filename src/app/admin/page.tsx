import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminDashboardClient from './AdminDashboardClient'
import { getOrders, getProducts } from '@/lib/actions'

export default async function AdminDashboard() {
  const session = await getSession()
  
  if (session !== 'ADMIN') {
    redirect('/admin/login')
  }

  const [orders, products] = await Promise.all([
    getOrders(),
    getProducts(),
  ])

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length
  const lowStockProducts = products.filter((p) => p.stock < 10).length
  const recentOrders = orders.slice(0, 5)

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <AdminDashboardClient
        pendingOrders={pendingOrders}
        lowStockProducts={lowStockProducts}
        recentOrders={recentOrders}
      />
    </ProtectedRoute>
  )
}


