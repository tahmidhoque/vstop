"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/generated/enums";
import type { BasketItem } from "@/types";
import {
  calculateDiscountedPrices,
  isOfferActive,
  type Offer,
} from "./offer-utils";

export async function createOrder(username: string, items: BasketItem[]) {
  // Validate stock availability
  for (const item of items) {
    if (item.variantId) {
      // Check variant stock
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    } else {
      // Check base product stock
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }
  }

  // Fetch active offers
  const offersData = await db.offer.findMany({
    where: { active: true },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  // Convert to Offer format
  const offers: Offer[] = offersData
    .filter((offer) => {
      const now = new Date();
      if (offer.startDate && new Date(offer.startDate) > now) return false;
      if (offer.endDate && new Date(offer.endDate) < now) return false;
      return true;
    })
    .map((offer) => ({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      quantity: offer.quantity,
      price: Number(offer.price),
      active: offer.active,
      startDate: offer.startDate,
      endDate: offer.endDate,
      productIds: offer.products.map((po) => po.productId),
    }));

  // Calculate discounted prices
  const discountedPrices = calculateDiscountedPrices(items, offers);

  // Generate order number - use a transaction-safe approach
  // Get the highest order number and increment, or start at 1
  const lastOrder = await db.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let orderNumber: string;
  if (lastOrder?.orderNumber) {
    // Extract the number from the last order number (e.g., "ORD-000001" -> 1)
    const lastNum = parseInt(lastOrder.orderNumber.replace("ORD-", ""), 10);
    orderNumber = `ORD-${String(lastNum + 1).padStart(6, "0")}`;
  } else {
    // First order
    orderNumber = "ORD-000001";
  }

  // Create order and items, then update stock
  const order = await db.order.create({
    data: {
      orderNumber,
      username,
      status: "PENDING",
      items: {
        create: items.map((item) => {
          const key = `${item.productId}-${item.variantId || "base"}`;
          const discounted = discountedPrices.get(key);
          const finalPrice = discounted ? discounted.price : item.price;
          const offerId = discounted?.offerId || null;

          return {
            productId: item.productId,
            variantId: item.variantId || null,
            flavour: item.flavour || null,
            quantity: item.quantity,
            priceAtTime: finalPrice,
            offerId,
          };
        }),
      },
    },
  });

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
      });
    } else {
      // Update base product stock
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  revalidatePath("/admin/orders");
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If cancelling, restore stock
  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }
  }

  // If un-cancelling, deduct stock again
  if (order.status === "CANCELLED" && status !== "CANCELLED") {
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
  }

  await db.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin/orders");
}

export async function updateOrder(
  orderId: string,
  username: string,
  items: BasketItem[],
  manualDiscount: number | null = null,
  totalOverride: number | null = null,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
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
      });
    } else {
      await db.product.update({
        where: { id: oldItem.productId },
        data: {
          stock: {
            increment: oldItem.quantity,
          },
        },
      });
    }
  }

  // Validate new stock availability
  for (const item of items) {
    if (item.variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant || variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    } else {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }
  }

  // Fetch active offers
  const offersData = await db.offer.findMany({
    where: { active: true },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  // Convert to Offer format
  const offers: Offer[] = offersData
    .filter((offer) => {
      const now = new Date();
      if (offer.startDate && new Date(offer.startDate) > now) return false;
      if (offer.endDate && new Date(offer.endDate) < now) return false;
      return true;
    })
    .map((offer) => ({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      quantity: offer.quantity,
      price: Number(offer.price),
      active: offer.active,
      startDate: offer.startDate,
      endDate: offer.endDate,
      productIds: offer.products.map((po) => po.productId),
    }));

  // Get current product prices for discount calculation
  // We need to fetch products to get their current prices
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  // Create items with current product prices for discount calculation
  const itemsWithProductPrices = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return item;

    // Use current product price, not the edited price
    const currentPrice = Number(product.price);
    return {
      ...item,
      price: currentPrice,
    };
  });

  // Calculate discounted prices using current product prices
  const discountedPrices = calculateDiscountedPrices(itemsWithProductPrices, offers);

  // Delete old items and create new ones
  await db.orderItem.deleteMany({
    where: { orderId },
  });

  await db.order.update({
    where: { id: orderId },
    data: {
      username,
      manualDiscount: manualDiscount !== null ? manualDiscount : null,
      totalOverride: totalOverride !== null ? totalOverride : null,
      items: {
        create: items.map((item) => {
          const key = `${item.productId}-${item.variantId || "base"}`;
          const discounted = discountedPrices.get(key);
          // Use discounted price if available, otherwise use the manually edited price from items
          const finalPrice = discounted ? discounted.price : item.price;
          const offerId = discounted?.offerId || null;

          return {
            productId: item.productId,
            variantId: item.variantId || null,
            flavour: item.flavour || null,
            quantity: item.quantity,
            priceAtTime: finalPrice,
            offerId,
          };
        }),
      },
    },
  });

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
      });
    } else {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  revalidatePath("/admin/orders");
}

export async function deleteOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Restore stock if order is not cancelled (cancelled orders already had stock restored)
  if (order.status !== "CANCELLED") {
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }
  }

  // Delete the order (items will be deleted automatically due to cascade)
  await db.order.delete({
    where: { id: orderId },
  });

  revalidatePath("/admin/orders");
}

export async function getProducts(includeHidden: boolean = false) {
  const products = await db.product.findMany({
    where: includeHidden ? undefined : { visible: true },
    include: {
      variants: {
        orderBy: { flavour: "asc" },
      },
      offers: {
        include: {
          offer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number for client component serialization
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    variants: product.variants.map((variant) => ({
      ...variant,
    })),
    offers: product.offers.map((po) => ({
      ...po.offer,
      price: Number(po.offer.price),
    })),
  }));
}

export async function getOffers() {
  const offers = await db.offer.findMany({
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number and map to simpler structure
  return offers.map((offer) => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    quantity: offer.quantity,
    price: Number(offer.price),
    active: offer.active,
    startDate: offer.startDate,
    endDate: offer.endDate,
    productIds: offer.products.map((po) => po.productId),
  }));
}

export async function getOffer(id: string) {
  const offer = await db.offer.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!offer) return null;

  // Convert Decimal to number and map to simpler structure
  return {
    id: offer.id,
    name: offer.name,
    description: offer.description,
    quantity: offer.quantity,
    price: Number(offer.price),
    active: offer.active,
    startDate: offer.startDate,
    endDate: offer.endDate,
    productIds: offer.products.map((po) => po.productId),
  };
}

export async function createOffer(data: {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  active?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  productIds: string[];
}) {
  const offer = await db.offer.create({
    data: {
      name: data.name,
      description: data.description || null,
      quantity: data.quantity,
      price: data.price,
      active: data.active ?? true,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      products: {
        create: data.productIds.map((productId) => ({
          productId,
        })),
      },
    },
    include: {
      products: true,
    },
  });

  revalidatePath("/admin/offers");
  revalidatePath("/store");
  return offer;
}

export async function updateOffer(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    quantity?: number;
    price?: number;
    active?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds?: string[];
  },
) {
  const existing = await db.offer.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!existing) {
    throw new Error("Offer not found");
  }

  // Update offer
  const offer = await db.offer.update({
    where: { id },
    data: {
      name: data.name,
      description:
        data.description !== undefined ? data.description : undefined,
      quantity: data.quantity,
      price: data.price,
      active: data.active,
      startDate: data.startDate !== undefined ? data.startDate : undefined,
      endDate: data.endDate !== undefined ? data.endDate : undefined,
    },
    include: { products: true },
  });

  // Handle product associations
  if (data.productIds !== undefined) {
    // Delete existing associations
    await db.productOffer.deleteMany({
      where: { offerId: id },
    });

    // Create new associations
    if (data.productIds.length > 0) {
      await db.productOffer.createMany({
        data: data.productIds.map((productId) => ({
          offerId: id,
          productId,
        })),
      });
    }
  }

  revalidatePath("/admin/offers");
  revalidatePath("/store");
  return offer;
}

export async function deleteOffer(id: string) {
  await db.offer.delete({
    where: { id },
  });

  revalidatePath("/admin/offers");
  revalidatePath("/store");
}

export async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { flavour: "asc" },
      },
    },
  });

  if (!product) return null;

  // Convert Decimal to number for client component serialization
  return {
    ...product,
    price: Number(product.price),
    variants: product.variants.map((variant) => ({
      ...variant,
    })),
  };
}

export async function createProduct(data: {
  name: string;
  price: number;
  stock: number;
  visible?: boolean;
  variants?: Array<{ flavour: string; stock: number }>;
}) {
  const product = await db.product.create({
    data: {
      name: data.name,
      price: data.price,
      stock: data.stock,
      visible: data.visible ?? true,
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
  });

  revalidatePath("/admin/products");
  revalidatePath("/store");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    price?: number;
    stock?: number;
    visible?: boolean;
    variants?: Array<{ id?: string; flavour: string; stock: number }>;
  },
) {
  // Get existing product with variants
  const existing = await db.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  // Update product
  const product = await db.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      stock: data.stock,
      visible: data.visible,
    },
    include: { variants: true },
  });

  // Handle variants
  if (data.variants !== undefined) {
    // Delete variants that are no longer in the list
    const existingVariantIds = new Set(existing.variants.map((v) => v.id));
    const newVariantIds = new Set(
      data.variants.filter((v) => v.id).map((v) => v.id!),
    );
    const toDelete = existing.variants.filter((v) => !newVariantIds.has(v.id));

    for (const variant of toDelete) {
      await db.productVariant.delete({
        where: { id: variant.id },
      });
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
        });
      } else {
        // Create new variant
        await db.productVariant.create({
          data: {
            productId: id,
            flavour: variantData.flavour,
            stock: variantData.stock,
          },
        });
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/store");
  return product;
}

export async function deleteProduct(id: string) {
  await db.product.delete({
    where: { id },
  });

  revalidatePath("/admin/products");
  revalidatePath("/store");
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
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number for client component serialization
  return orders.map((order) => ({
    ...order,
    manualDiscount: order.manualDiscount
      ? Number(order.manualDiscount)
      : null,
    totalOverride: order.totalOverride ? Number(order.totalOverride) : null,
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
  }));
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
  });

  if (!order) return null;

  // Convert Decimal to number for client component serialization
  return {
    ...order,
    manualDiscount: order.manualDiscount
      ? Number(order.manualDiscount)
      : null,
    totalOverride: order.totalOverride ? Number(order.totalOverride) : null,
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
  };
}

export async function getReportsData(startDate: Date, endDate: Date) {
  // Set startDate to beginning of day and endDate to end of day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const orders = await db.order.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
  const fulfilledOrders = orders.filter((o) => o.status === "FULFILLED").length;
  const unfulfilledOrders = orders.filter(
    (o) => o.status === "UNFULFILLED",
  ).length;

  // Calculate total sales from non-cancelled orders
  const totalSales = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => {
      // If total override is set, use it
      if (order.totalOverride) {
        return sum + Number(order.totalOverride);
      }

      // Calculate subtotal
      const subtotal = order.items.reduce(
        (itemSum, item) => itemSum + Number(item.priceAtTime) * item.quantity,
        0,
      );

      // Apply manual discount if set
      const manualDiscount = order.manualDiscount
        ? Number(order.manualDiscount)
        : 0;

      return sum + Math.max(0, subtotal - manualDiscount);
    }, 0);

  // Convert Decimal to number for client component serialization
  const ordersWithItems = orders.map((order) => ({
    ...order,
    manualDiscount: order.manualDiscount
      ? Number(order.manualDiscount)
      : null,
    totalOverride: order.totalOverride ? Number(order.totalOverride) : null,
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
  }));

  return {
    totalOrders,
    cancelledOrders,
    fulfilledOrders,
    unfulfilledOrders,
    totalSales,
    orders: ordersWithItems,
  };
}
