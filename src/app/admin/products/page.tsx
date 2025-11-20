import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ProductsPageClient from './ProductsPageClient'
import { getProducts } from '@/lib/actions'

export default async function ProductsPage() {
  const session = await getSession()
  
  if (session !== 'ADMIN') {
    redirect('/admin/login')
  }

  const products = await getProducts()

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <ProductsPageClient initialProducts={products} />
    </ProtectedRoute>
  )
}


