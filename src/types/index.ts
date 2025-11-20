export type { PasswordType, OrderStatus } from '@/generated/enums'
import type { OrderStatus } from '@/generated/enums'

export interface BasketItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  variantId?: string
  flavour?: string
}

export interface OrderWithItems {
  id: string
  username: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  items: Array<{
    id: string
    quantity: number
    priceAtTime: number | string
    flavour?: string | null
    product: {
      id: string
      name: string
    }
    variant?: {
      id: string
      flavour: string
      stock: number
    } | null
  }>
}
