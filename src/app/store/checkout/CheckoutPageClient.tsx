'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CheckoutForm from '@/components/store/CheckoutForm'
import { createOrder } from '@/lib/actions'
import type { BasketItem } from '@/types'

export default function CheckoutPageClient() {
  const [basket, setBasket] = useState<BasketItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const savedBasket = localStorage.getItem('basket')
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket))
      } catch (err) {
        console.error('Failed to load basket:', err)
      }
    }

    if (!savedBasket || JSON.parse(savedBasket).length === 0) {
      router.push('/store')
    }
  }, [router])

  const handleSubmit = async (username: string, items: BasketItem[]) => {
    await createOrder(username, items)
    localStorage.removeItem('basket')
  }

  if (basket.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <CheckoutForm items={basket} onSubmit={handleSubmit} />
    </div>
  )
}


