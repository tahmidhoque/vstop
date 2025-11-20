'use client'

import { useState, useEffect } from 'react'
import type { BasketItem } from '@/types'

interface BasketProps {
  items: BasketItem[]
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void
  onRemove: (productId: string, variantId?: string) => void
  onCheckout: () => void
}

export default function Basket({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: BasketProps) {
  const [isOpen, setIsOpen] = useState(false)

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-t-0 md:border-l md:border-gray-200 md:h-full md:sticky md:top-0">
        <div className="text-center text-gray-600 py-8">
          <p>Your basket is empty</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile basket toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:hidden bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 min-h-[44px] z-40"
      >
        <span>Basket</span>
        {itemCount > 0 && (
          <span className="bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-bold">
            {itemCount}
          </span>
        )}
      </button>

      {/* Basket panel */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Basket</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>
          <BasketContent
            items={items}
            total={total}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onCheckout={() => {
              onCheckout()
              setIsOpen(false)
            }}
          />
        </div>
      </div>

      {/* Desktop basket sidebar */}
      <div className="hidden md:block w-80 bg-white border-l border-gray-200 h-full sticky top-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Basket</h2>
        </div>
        <BasketContent
          items={items}
          total={total}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onCheckout={onCheckout}
        />
      </div>
    </>
  )
}

function BasketContent({
  items,
  total,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: {
  items: BasketItem[]
  total: number
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void
  onRemove: (productId: string, variantId?: string) => void
  onCheckout: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId || 'base'}`}
            className="border-b border-gray-200 pb-4 last:border-b-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  £{item.price.toFixed(2)} each
                </p>
              </div>
              <button
                onClick={() => onRemove(item.productId, item.variantId)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateQuantity(
                    item.productId,
                    Math.max(0, item.quantity - 1),
                    item.variantId
                  )
                }
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 min-h-[44px] min-w-[44px]"
              >
                −
              </button>
              <span className="w-12 text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  onUpdateQuantity(
                    item.productId,
                    Math.min(item.stock, item.quantity + 1),
                    item.variantId
                  )
                }
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
              >
                +
              </button>
              <span className="ml-auto font-semibold">
                £{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold">£{total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
