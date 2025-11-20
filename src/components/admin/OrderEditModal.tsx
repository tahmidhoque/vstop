'use client'

import { useState, useEffect } from 'react'
import { updateOrder, getProducts } from '@/lib/actions'
import type { OrderWithItems } from '@/types'
import type { BasketItem } from '@/types'

interface OrderEditModalProps {
  order: OrderWithItems
  onClose: () => void
  onSave: () => void
}

export default function OrderEditModal({
  order,
  onClose,
  onSave,
}: OrderEditModalProps) {
  const [username, setUsername] = useState(order.username)
  const [items, setItems] = useState<BasketItem[]>([])
  const [products, setProducts] = useState<
    Array<{
      id: string
      name: string
      price: number
      stock: number
      variants?: Array<{ id: string; flavour: string; stock: number }>
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts()
      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
          variants: p.variants?.map((v: { id: string; flavour: string; stock: number }) => ({
            id: v.id,
            flavour: v.flavour,
            stock: v.stock,
          })),
        }))
      )
    }

    loadProducts()

    // Convert order items to basket items
    setItems(
      order.items.map((item) => ({
        productId: item.product.id,
        name: item.flavour
          ? `${item.product.name} (${item.flavour})`
          : item.product.name,
        price: Number(item.priceAtTime),
        quantity: item.quantity,
        stock: 0, // Will be updated when products load
        variantId: item.variant?.id,
        flavour: item.flavour || undefined,
      }))
    )
  }, [order])

  useEffect(() => {
    // Update stock for items
    setItems((currentItems) =>
      currentItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return item

        // If item has a variant, use variant stock
        if (item.variantId && product.variants) {
          const variant = product.variants.find((v) => v.id === item.variantId)
          if (variant) {
            return {
              ...item,
              stock: variant.stock + item.quantity,
              price: product.price,
            }
          }
        }

        // Use base product stock or sum of variant stocks
        const stock =
          product.variants && product.variants.length > 0
            ? product.variants.reduce((sum, v) => sum + v.stock, 0) + item.quantity
            : product.stock + item.quantity

        return {
          ...item,
          stock,
          price: product.price,
        }
      })
    )
  }, [products])

  const handleAddProduct = (productId: string, variantId?: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    // If product has variants, require variant selection
    if (product.variants && product.variants.length > 0 && !variantId) {
      return // Can't add product with variants without selecting one
    }

    const variant = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : null

    const displayName = variant
      ? `${product.name} (${variant.flavour})`
      : product.name

    const itemStock = variant ? variant.stock : product.stock

    const existing = items.find(
      (i) => i.productId === productId && i.variantId === variantId
    )
    if (existing) {
      setItems((current) =>
        current.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i
        )
      )
    } else {
      setItems((current) => [
        ...current,
        {
          productId: product.id,
          name: displayName,
          price: product.price,
          quantity: 1,
          stock: itemStock,
          variantId: variant?.id,
          flavour: variant?.flavour,
        },
      ])
    }
  }

  const handleUpdateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string
  ) => {
    if (quantity === 0) {
      setItems((current) =>
        current.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        )
      )
    } else {
      setItems((current) =>
        current.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: Math.min(quantity, item.stock) }
            : item
        )
      )
    }
  }

  const handleRemove = (productId: string, variantId?: string) => {
    setItems((current) =>
      current.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateOrder(order.id, username, items)
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Order</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1">
          <div className="mb-6">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Product
            </label>
            <select
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  // Format: "productId" or "productId:variantId"
                  const [productId, variantId] = value.split(':')
                  handleAddProduct(productId, variantId)
                  e.target.value = ''
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] text-base"
              disabled={loading}
            >
              <option value="">Select a product...</option>
              {products.map((product) => {
                if (product.variants && product.variants.length > 0) {
                  return (
                    <optgroup key={product.id} label={`${product.name} - £${product.price.toFixed(2)}`}>
                      {product.variants.map((variant) => (
                        <option
                          key={variant.id}
                          value={`${product.id}:${variant.id}`}
                        >
                          {variant.flavour} ({variant.stock > 5 ? 'In Stock' : `${variant.stock} available`})
                        </option>
                      ))}
                    </optgroup>
                  )
                }
                return (
                  <option key={product.id} value={product.id}>
                    {product.name} - £{product.price.toFixed(2)} ({product.stock > 5 ? 'In Stock' : `${product.stock} available`})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Items</h3>
            {items.length === 0 ? (
              <p className="text-gray-600 text-sm">No items in order</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        £{item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.variantId
                          )
                        }
                        className="w-10 h-10 sm:w-8 sm:h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] text-lg sm:text-base"
                        disabled={loading}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-medium text-base">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        disabled={item.quantity >= item.stock || loading}
                        className="w-10 h-10 sm:w-8 sm:h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] text-lg sm:text-base"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <span className="ml-auto sm:ml-4 font-semibold text-sm sm:text-base flex-shrink-0">
                        £{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId, item.variantId)}
                        className="text-red-600 hover:text-red-700 active:text-red-800 text-sm min-h-[44px] px-2 sm:ml-2"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold">£{total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

