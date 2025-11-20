'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/store/ProductCard'
import Basket from '@/components/store/Basket'
import { getProducts, getOffers } from '@/lib/actions'
import type { BasketItem } from '@/types'
import type { Offer } from '@/lib/offer-utils'

export default function StorePageClient() {
  const [products, setProducts] = useState<
    Array<{
      id: string
      name: string
      price: number
      stock: number
      variants?: Array<{ id: string; flavour: string; stock: number }>
      offers?: Array<{
        id: string
        name: string
        description?: string | null
        quantity: number
        price: number
        active: boolean
      }>
    }>
  >([])
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Load products and offers
    async function loadData() {
      try {
        const [productsData, offersData] = await Promise.all([
          getProducts(),
          getOffers(),
        ])

        setProducts(
          productsData.map((p: { id: string; name: string; price: number; stock: number; variants?: Array<{ id: string; flavour: string; stock: number }>; offers?: Array<{ id: string; name: string; description?: string | null; quantity: number; price: number; active: boolean }> }) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            stock: p.stock,
            variants: p.variants?.map((v) => ({
              id: v.id,
              flavour: v.flavour,
              stock: v.stock,
            })),
            offers: p.offers || [],
          }))
        )

        setOffers(offersData)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Load basket from localStorage
    const savedBasket = localStorage.getItem('basket')
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket))
      } catch (err) {
        console.error('Failed to load basket:', err)
      }
    }

    // Show success message if order was placed
    if (searchParams.get('success') === 'true') {
      localStorage.removeItem('basket')
      setBasket([])
      alert('Order placed successfully!')
      router.replace('/store')
    }
  }, [router, searchParams])

  useEffect(() => {
    // Sync basket with products to update stock
    setBasket((currentBasket) => {
      return currentBasket
        .map((item) => {
          const product = products.find((p) => p.id === item.productId)
          if (!product) return null

          // If item has a variant, find and use variant stock
          if (item.variantId && product.variants) {
            const variant = product.variants.find((v) => v.id === item.variantId)
            if (variant) {
              return {
                ...item,
                stock: variant.stock,
                price: product.price,
                quantity: Math.min(item.quantity, variant.stock),
              }
            }
          }

          // Use base product stock or sum of variant stocks
          const stock =
            product.variants && product.variants.length > 0
              ? product.variants.reduce((sum, v) => sum + v.stock, 0)
              : product.stock

          return {
            ...item,
            stock,
            price: product.price,
            quantity: Math.min(item.quantity, stock),
          }
        })
        .filter((item): item is BasketItem => item !== null)
    })
  }, [products])

  useEffect(() => {
    // Save basket to localStorage
    if (basket.length > 0) {
      localStorage.setItem('basket', JSON.stringify(basket))
    } else {
      localStorage.removeItem('basket')
    }
  }, [basket])

  const handleAddToBasket = (item: BasketItem) => {
    setBasket((current) => {
      // Find existing item - match by productId and variantId
      const existing = current.find(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId
      )
      if (existing) {
        return current.map((i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId
            ? {
                ...i,
                quantity: Math.min(i.quantity + 1, i.stock),
              }
            : i
        )
      }
      return [...current, item]
    })
  }

  const handleUpdateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string
  ) => {
    if (quantity === 0) {
      handleRemove(productId, variantId)
      return
    }
    setBasket((current) =>
      current.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const handleRemove = (productId: string, variantId?: string) => {
    setBasket((current) =>
      current.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      )
    )
  }

  const handleCheckout = () => {
    router.push('/store/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p>No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock}
                    variants={product.variants}
                    offers={product.offers || []}
                    onAddToBasket={handleAddToBasket}
                  />
                ))}
              </div>
            )}
          </div>
          <Basket
            items={basket}
            offers={offers}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  )
}


