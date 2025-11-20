'use server'

import { db } from './db'
import { revalidatePath } from 'next/cache'
import { OrderStatus } from '@prisma/client'
import type { BasketItem } from '@/types'

export async function createOrder(username: string, items: BasketItem[]) {
  // Validate stock availability
  for (const item of items) {
    if (item.variantId) {
      // Check variant stock
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`)
      }
    } else {
      // Check base product stock
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`)
      }
    }
  }

  // Create order and items, then update stock
  const order = await db.order.create({
    data: {
      username,
      status: 'PENDING',
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          flavour: item.flavour || null,
          quantity: item.quantity,
          priceAtTime: item.price,
        })),
      },
    },
  })

  // Update stock levels
  for (const item of items) {
    if (item.variantId) {
      // Update variant stock
      await db.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    } else {
      // Update base product stock
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }
  }

  revalidatePath('/admin/orders')
  return order
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // If cancelling, restore stock
  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }
  }

  // If un-cancelling, deduct stock again
  if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }
    }
  }

  await db.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath('/admin/orders')
}

export async function updateOrder(
  orderId: string,
  username: string,
  items: BasketItem[]
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Restore stock from old items
  for (const oldItem of order.items) {
    if (oldItem.variantId) {
      await db.productVariant.update({
        where: { id: oldItem.variantId },
        data: {
          stock: {
            increment: oldItem.quantity,
          },
        },
      })
    } else {
      await db.product.update({
        where: { id: oldItem.productId },
        data: {
          stock: {
            increment: oldItem.quantity,
          },
        },
      })
    }
  }

  // Validate new stock availability
  for (const item of items) {
    if (item.variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`)
      }
    } else {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`)
      }
    }
  }

  // Delete old items and create new ones
  await db.orderItem.deleteMany({
    where: { orderId },
  })

  await db.order.update({
    where: { id: orderId },
    data: {
      username,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          flavour: item.flavour || null,
          quantity: item.quantity,
          priceAtTime: item.price,
        })),
      },
    },
  })

  // Deduct new stock
  for (const item of items) {
    if (item.variantId) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    } else {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }
  }

  revalidatePath('/admin/orders')
}

export async function getProducts() {
  const products = await db.product.findMany({
    include: {
      variants: {
        orderBy: { flavour: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  // Convert Decimal to number for client component serialization
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    variants: product.variants.map((variant) => ({
      ...variant,
    })),
  }))
}

export async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { flavour: 'asc' },
      },
    },
  })
  
  if (!product) return null
  
  // Convert Decimal to number for client component serialization
  return {
    ...product,
    price: Number(product.price),
    variants: product.variants.map((variant) => ({
      ...variant,
    })),
  }
}

export async function createProduct(data: {
  name: string
  price: number
  stock: number
  variants?: Array<{ flavour: string; stock: number }>
}) {
  const product = await db.product.create({
    data: {
      name: data.name,
      price: data.price,
      stock: data.stock,
      variants: data.variants
        ? {
            create: data.variants.map((v) => ({
              flavour: v.flavour,
              stock: v.stock,
            })),
          }
        : undefined,
    },
    include: {
      variants: true,
    },
  })

  revalidatePath('/admin/products')
  revalidatePath('/store')
  return product
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    price?: number
    stock?: number
    variants?: Array<{ id?: string; flavour: string; stock: number }>
  }
) {
  // Get existing product with variants
  const existing = await db.product.findUnique({
    where: { id },
    include: { variants: true },
  })

  if (!existing) {
    throw new Error('Product not found')
  }

  // Update product
  const product = await db.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      stock: data.stock,
    },
    include: { variants: true },
  })

  // Handle variants
  if (data.variants !== undefined) {
    // Delete variants that are no longer in the list
    const existingVariantIds = new Set(
      existing.variants.map((v) => v.id)
    )
    const newVariantIds = new Set(
      data.variants.filter((v) => v.id).map((v) => v.id!)
    )
    const toDelete = existing.variants.filter(
      (v) => !newVariantIds.has(v.id)
    )

    for (const variant of toDelete) {
      await db.productVariant.delete({
        where: { id: variant.id },
      })
    }

    // Update or create variants
    for (const variantData of data.variants) {
      if (variantData.id) {
        // Update existing variant
        await db.productVariant.update({
          where: { id: variantData.id },
          data: {
            flavour: variantData.flavour,
            stock: variantData.stock,
          },
        })
      } else {
        // Create new variant
        await db.productVariant.create({
          data: {
            productId: id,
            flavour: variantData.flavour,
            stock: variantData.stock,
          },
        })
      }
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/store')
  return product
}

export async function deleteProduct(id: string) {
  await db.product.delete({
    where: { id },
  })

  revalidatePath('/admin/products')
  revalidatePath('/store')
}

export async function getOrders() {
  const orders = await db.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  // Convert Decimal to number for client component serialization
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      priceAtTime: Number(item.priceAtTime),
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
      variant: item.variant
        ? {
            ...item.variant,
          }
        : null,
    })),
  }))
}

export async function getOrder(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })
  
  if (!order) return null
  
  // Convert Decimal to number for client component serialization
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      priceAtTime: Number(item.priceAtTime),
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
      variant: item.variant
        ? {
            ...item.variant,
          }
        : null,
    })),
  }
}
