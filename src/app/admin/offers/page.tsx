import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OffersPageClient from './OffersPageClient'
import { getOffers, getProducts } from '@/lib/actions'

export default async function OffersPage() {
  const session = await getSession()
  
  if (session !== 'ADMIN') {
    redirect('/admin/login')
  }

  const [offers, products] = await Promise.all([
    getOffers(),
    getProducts(),
  ])

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <OffersPageClient 
        initialOffers={offers} 
        initialProducts={products.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }))}
      />
    </ProtectedRoute>
  )
}

