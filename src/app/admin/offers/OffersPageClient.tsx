'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OfferForm from '@/components/admin/OfferForm'
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getProducts,
} from '@/lib/actions'

interface Offer {
  id: string
  name: string
  description?: string | null
  quantity: number
  price: number
  active: boolean
  startDate?: Date | null
  endDate?: Date | null
  productIds: string[]
}

interface Product {
  id: string
  name: string
}

interface OffersPageClientProps {
  initialOffers: Offer[]
  initialProducts: Product[]
}

export default function OffersPageClient({
  initialOffers,
  initialProducts,
}: OffersPageClientProps) {
  const [offers, setOffers] = useState(initialOffers)
  const [products, setProducts] = useState(initialProducts)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  // Sync offers when initialOffers changes (after router.refresh())
  useEffect(() => {
    setOffers(initialOffers)
  }, [initialOffers])

  // Load products if not provided
  useEffect(() => {
    if (products.length === 0) {
      getProducts().then((productsData) => {
        setProducts(
          productsData.map((p) => ({
            id: p.id,
            name: p.name,
          }))
        )
      })
    }
  }, [products.length])

  const handleCreate = async (data: {
    name: string
    description?: string | null
    quantity: number
    price: number
    active: boolean
    startDate?: Date | null
    endDate?: Date | null
    productIds: string[]
  }) => {
    await createOffer({
      name: data.name,
      description: data.description ?? undefined,
      quantity: data.quantity,
      price: data.price,
      active: data.active,
      startDate: data.startDate,
      endDate: data.endDate,
      productIds: data.productIds,
    })
    router.refresh()
    setShowForm(false)
  }

  const handleUpdate = async (data: {
    name: string
    description?: string | null
    quantity: number
    price: number
    active: boolean
    startDate?: Date | null
    endDate?: Date | null
    productIds: string[]
  }) => {
    if (!editingOffer) return
    await updateOffer(editingOffer.id, data)
    router.refresh()
    setEditingOffer(null)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      await deleteOffer(id)
      router.refresh()
    }
  }

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingOffer(null)
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                disabled={products.length === 0}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Add Offer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showForm ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingOffer ? 'Edit Offer' : 'Add New Offer'}
            </h2>
            <OfferForm
              offer={editingOffer || undefined}
              products={products}
              onSubmit={editingOffer ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        ) : null}

        {products.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You need to create products before you can
              create offers. <Link href="/admin/products" className="underline">Go to Products</Link>
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {offers.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <p>No offers yet. Add your first offer to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Offer Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Eligible Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {offer.name}
                        </div>
                        {offer.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {offer.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Any <span className="font-semibold">{offer.quantity}</span> for{' '}
                          <span className="font-semibold">£{offer.price.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {offer.productIds.length} product
                          {offer.productIds.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            offer.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {offer.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Start:</span>{' '}
                            {formatDate(offer.startDate)}
                          </div>
                          <div>
                            <span className="font-medium">End:</span>{' '}
                            {formatDate(offer.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(offer)}
                            className="text-blue-600 hover:text-blue-900 min-h-[44px] px-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="text-red-600 hover:text-red-900 min-h-[44px] px-3"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

