"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { OrderStatus, OrderType } from "@/generated/enums";
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

/**
 * Create a personal use order for stock tracking without revenue impact
 * @param items - Array of items to include in the personal use order
 * @returns The created order
 */
export async function createPersonalUseOrder(items: BasketItem[]) {
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

  // Generate order number
  const lastOrder = await db.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let orderNumber: string;
  if (lastOrder?.orderNumber) {
    const lastNum = parseInt(lastOrder.orderNumber.replace("ORD-", ""), 10);
    orderNumber = `ORD-${String(lastNum + 1).padStart(6, "0")}`;
  } else {
    orderNumber = "ORD-000001";
  }

  // Create personal use order
  const order = await db.order.create({
    data: {
      orderNumber,
      username: "PERSONAL_USE",
      status: "FULFILLED", // Personal use orders are immediately fulfilled
      orderType: OrderType.PERSONAL_USE,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          flavour: item.flavour || null,
          quantity: item.quantity,
          priceAtTime: 0, // No price for personal use
          offerId: null,
        })),
      },
    },
  });

  // Update stock levels
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
  revalidatePath("/admin/stock");
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

export async function deleteAllOrders() {
  // Delete all orders (items will be deleted automatically due to cascade)
  // Note: We do NOT restore stock here as this is for deleting historical records,
  // not cancelling active orders. Stock was already deducted when orders were created.
  await db.order.deleteMany({});

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

export async function getReportsData(
  startDate: Date,
  endDate: Date,
  includeStatuses?: OrderStatus[],
) {
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
      ...(includeStatuses && includeStatuses.length > 0
        ? { status: { in: includeStatuses } }
        : {}),
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      faultyReturns: {
        include: {
          product: true,
        },
      },
      replacementForReturns: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Separate orders by type
  // Personal use orders are excluded from revenue calculations
  const replacementOrders = orders.filter(
    (o) => o.orderType === OrderType.REPLACEMENT,
  );
  const customerOrders = orders.filter(
    (o) => o.orderType === OrderType.CUSTOMER,
  );

  const totalOrders = customerOrders.length;
  const cancelledOrders = customerOrders.filter(
    (o) => o.status === "CANCELLED",
  ).length;
  const fulfilledOrders = customerOrders.filter(
    (o) => o.status === "FULFILLED",
  ).length;
  const unfulfilledOrders = customerOrders.filter(
    (o) => o.status === "UNFULFILLED",
  ).length;

  // Calculate total sales from non-cancelled customer orders only
  // Exclude personal use and replacement orders from revenue
  // Subtract value of faulty returns from each order
  const totalSales = customerOrders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => {
      let orderTotal = 0;

      // If total override is set, use it
      if (order.totalOverride) {
        orderTotal = Number(order.totalOverride);
      } else {
        // Calculate subtotal
        const subtotal = order.items.reduce(
          (itemSum, item) => itemSum + Number(item.priceAtTime) * item.quantity,
          0,
        );

        // Apply manual discount if set
        const manualDiscount = order.manualDiscount
          ? Number(order.manualDiscount)
          : 0;

        orderTotal = Math.max(0, subtotal - manualDiscount);
      }

      // Subtract faulty return losses from this order
      const faultyLoss = order.faultyReturns.reduce(
        (loss, fr) => loss + Number(fr.product.price) * fr.quantity,
        0,
      );

      return sum + Math.max(0, orderTotal - faultyLoss);
    }, 0);

  // Get faulty losses for the period
  const faultyLosses = await getFaultyLosses(start, end);

  // Convert Decimal to number for client component serialization
  const ordersWithItems = customerOrders.map((order) => ({
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
    faultyReturns: order.faultyReturns.map((fr) => ({
      id: fr.id,
      returnNumber: fr.returnNumber,
      quantity: fr.quantity,
      faultyReason: fr.faultyReason,
      status: fr.status,
      product: {
        id: fr.product.id,
        name: fr.product.name,
        price: Number(fr.product.price),
      },
    })),
  }));

  const replacementOrdersWithItems = replacementOrders.map((order) => ({
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
    faultyReturns: order.faultyReturns.map((fr) => ({
      id: fr.id,
      returnNumber: fr.returnNumber,
      quantity: fr.quantity,
      faultyReason: fr.faultyReason,
      status: fr.status,
      product: {
        id: fr.product.id,
        name: fr.product.name,
        price: Number(fr.product.price),
      },
    })),
  }));

  // Calculate product breakdown from non-cancelled customer orders
  // Group by both product and variant to show each variant separately
  const productBreakdownMap = new Map<string, {
    productId: string;
    variantId: string | null;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    orderIds: Set<string>;
  }>();

  customerOrders
    .filter((order) => order.status !== "CANCELLED")
    .forEach((order) => {
      order.items.forEach((item) => {
        // Create unique key for product + variant combination
        const key = `${item.productId}-${item.variantId || 'base'}`;
        const existing = productBreakdownMap.get(key);
        const itemRevenue = Number(item.priceAtTime) * item.quantity;

        // Build product name with variant/flavour if applicable
        let displayName = item.product.name;
        if (item.flavour) {
          displayName += ` (${item.flavour})`;
        }

        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += itemRevenue;
          existing.orderIds.add(order.id);
        } else {
          productBreakdownMap.set(key, {
            productId: item.productId,
            variantId: item.variantId || null,
            productName: displayName,
            totalQuantity: item.quantity,
            totalRevenue: itemRevenue,
            orderIds: new Set([order.id]),
          });
        }
      });
    });

  const productBreakdown = Array.from(productBreakdownMap.values()).map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    totalQuantity: item.totalQuantity,
    totalRevenue: item.totalRevenue,
    orderCount: item.orderIds.size,
  }));

  return {
    totalOrders,
    cancelledOrders,
    fulfilledOrders,
    unfulfilledOrders,
    totalSales,
    orders: ordersWithItems,
    replacementOrders: replacementOrdersWithItems,
    faultyLosses,
    productBreakdown,
  };
}

// Faulty Returns Actions

export async function createFaultyReturn(data: {
  orderId?: string | null;
  orderNumber?: string | null;
  productId: string;
  variantId?: string | null;
  quantity: number;
  faultyReason: string;
  notes?: string | null;
}) {
  // Generate return number
  const lastReturn = await db.faultyReturn.findFirst({
    orderBy: { createdAt: "desc" },
    select: { returnNumber: true },
  });

  let returnNumber: string;
  if (lastReturn?.returnNumber) {
    const lastNum = parseInt(lastReturn.returnNumber.replace("RET-", ""), 10);
    returnNumber = `RET-${String(lastNum + 1).padStart(6, "0")}`;
  } else {
    returnNumber = "RET-000001";
  }

  // If pre-sale (no orderId), deduct stock
  if (!data.orderId) {
    if (data.variantId) {
      await db.productVariant.update({
        where: { id: data.variantId },
        data: {
          stock: {
            decrement: data.quantity,
          },
        },
      });
    } else {
      await db.product.update({
        where: { id: data.productId },
        data: {
          stock: {
            decrement: data.quantity,
          },
        },
      });
    }
  }

  const faultyReturn = await db.faultyReturn.create({
    data: {
      returnNumber,
      orderId: data.orderId || null,
      orderNumber: data.orderNumber || null,
      productId: data.productId,
      variantId: data.variantId || null,
      quantity: data.quantity,
      faultyReason: data.faultyReason,
      notes: data.notes || null,
      status: "REPORTED",
    },
    include: {
      product: true,
      variant: true,
      order: true,
    },
  });

  revalidatePath("/admin/faulty");
  
  // Convert Decimal to number for client component serialization
  return {
    id: faultyReturn.id,
    returnNumber: faultyReturn.returnNumber,
    orderId: faultyReturn.orderId,
    orderNumber: faultyReturn.orderNumber,
    productId: faultyReturn.productId,
    variantId: faultyReturn.variantId,
    quantity: faultyReturn.quantity,
    faultyReason: faultyReturn.faultyReason,
    notes: faultyReturn.notes,
    status: faultyReturn.status,
    replacementOrderId: faultyReturn.replacementOrderId,
    createdAt: faultyReturn.createdAt,
    updatedAt: faultyReturn.updatedAt,
    product: {
      id: faultyReturn.product.id,
      name: faultyReturn.product.name,
      price: Number(faultyReturn.product.price),
      stock: faultyReturn.product.stock,
    },
    variant: faultyReturn.variant
      ? {
          id: faultyReturn.variant.id,
          flavour: faultyReturn.variant.flavour,
          stock: faultyReturn.variant.stock,
        }
      : null,
    order: faultyReturn.order
      ? {
          id: faultyReturn.order.id,
          orderNumber: faultyReturn.order.orderNumber,
          username: faultyReturn.order.username,
          status: faultyReturn.order.status,
          orderType: faultyReturn.order.orderType,
          manualDiscount: faultyReturn.order.manualDiscount
            ? Number(faultyReturn.order.manualDiscount)
            : null,
          totalOverride: faultyReturn.order.totalOverride
            ? Number(faultyReturn.order.totalOverride)
            : null,
        }
      : null,
    replacementOrder: null,
  };
}

export async function updateFaultyReturnStatus(
  id: string,
  status: "REPORTED" | "INSPECTED" | "REPLACED" | "DISPOSED",
) {
  const faultyReturn = await db.faultyReturn.update({
    where: { id },
    data: { status },
    include: {
      product: true,
      variant: true,
      order: true,
      replacementOrder: true,
    },
  });

  revalidatePath("/admin/faulty");
  
  // Convert Decimal to number for client component serialization
  return {
    id: faultyReturn.id,
    returnNumber: faultyReturn.returnNumber,
    orderId: faultyReturn.orderId,
    orderNumber: faultyReturn.orderNumber,
    productId: faultyReturn.productId,
    variantId: faultyReturn.variantId,
    quantity: faultyReturn.quantity,
    faultyReason: faultyReturn.faultyReason,
    notes: faultyReturn.notes,
    status: faultyReturn.status,
    replacementOrderId: faultyReturn.replacementOrderId,
    createdAt: faultyReturn.createdAt,
    updatedAt: faultyReturn.updatedAt,
    product: {
      id: faultyReturn.product.id,
      name: faultyReturn.product.name,
      price: Number(faultyReturn.product.price),
      stock: faultyReturn.product.stock,
    },
    variant: faultyReturn.variant
      ? {
          id: faultyReturn.variant.id,
          flavour: faultyReturn.variant.flavour,
          stock: faultyReturn.variant.stock,
        }
      : null,
    order: faultyReturn.order
      ? {
          id: faultyReturn.order.id,
          orderNumber: faultyReturn.order.orderNumber,
          username: faultyReturn.order.username,
          status: faultyReturn.order.status,
          orderType: faultyReturn.order.orderType,
          manualDiscount: faultyReturn.order.manualDiscount
            ? Number(faultyReturn.order.manualDiscount)
            : null,
          totalOverride: faultyReturn.order.totalOverride
            ? Number(faultyReturn.order.totalOverride)
            : null,
        }
      : null,
    replacementOrder: faultyReturn.replacementOrder
      ? {
          id: faultyReturn.replacementOrder.id,
          orderNumber: faultyReturn.replacementOrder.orderNumber,
          username: faultyReturn.replacementOrder.username,
          status: faultyReturn.replacementOrder.status,
          orderType: faultyReturn.replacementOrder.orderType,
          manualDiscount: faultyReturn.replacementOrder.manualDiscount
            ? Number(faultyReturn.replacementOrder.manualDiscount)
            : null,
          totalOverride: faultyReturn.replacementOrder.totalOverride
            ? Number(faultyReturn.replacementOrder.totalOverride)
            : null,
        }
      : null,
  };
}

export async function createReplacementOrder(
  faultyReturnId: string,
  username: string,
) {
  const faultyReturn = await db.faultyReturn.findUnique({
    where: { id: faultyReturnId },
    include: {
      product: true,
      variant: true,
    },
  });

  if (!faultyReturn) {
    throw new Error("Faulty return not found");
  }

  if (faultyReturn.replacementOrderId) {
    throw new Error("Replacement order already exists for this return");
  }

  // Generate order number
  const lastOrder = await db.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let orderNumber: string;
  if (lastOrder?.orderNumber) {
    const lastNum = parseInt(lastOrder.orderNumber.replace("ORD-", ""), 10);
    orderNumber = `ORD-${String(lastNum + 1).padStart(6, "0")}`;
  } else {
    orderNumber = "ORD-000001";
  }

  // Create replacement order with price 0 (free replacement)
  const replacementOrder = await db.order.create({
    data: {
      orderNumber,
      username,
      status: "PENDING",
      orderType: OrderType.REPLACEMENT,
      items: {
        create: {
          productId: faultyReturn.productId,
          variantId: faultyReturn.variantId,
          flavour: faultyReturn.variant?.flavour || null,
          quantity: faultyReturn.quantity,
          priceAtTime: 0, // Free replacement
          offerId: null,
        },
      },
    },
  });

  // Link replacement order to faulty return
  await db.faultyReturn.update({
    where: { id: faultyReturnId },
    data: {
      replacementOrderId: replacementOrder.id,
      status: "REPLACED",
    },
  });

  // Deduct stock for replacement
  if (faultyReturn.variantId) {
    await db.productVariant.update({
      where: { id: faultyReturn.variantId },
      data: {
        stock: {
          decrement: faultyReturn.quantity,
        },
      },
    });
  } else {
    await db.product.update({
      where: { id: faultyReturn.productId },
      data: {
        stock: {
          decrement: faultyReturn.quantity,
        },
      },
    });
  }

  revalidatePath("/admin/faulty");
  revalidatePath("/admin/orders");
  return replacementOrder;
}

export async function getFaultyReturns(filters?: {
  type?: "PRE_SALE" | "POST_SALE" | "ALL";
  status?: "REPORTED" | "INSPECTED" | "REPLACED" | "DISPOSED";
  startDate?: Date;
  endDate?: Date;
}) {
  // Build where clause dynamically
  const whereConditions: Record<string, unknown> = {};

  if (filters?.type === "PRE_SALE") {
    whereConditions.orderId = null;
  } else if (filters?.type === "POST_SALE") {
    whereConditions.orderId = { not: null };
  }

  if (filters?.status) {
    whereConditions.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    const createdAtCondition: Record<string, Date> = {};
    if (filters.startDate) {
      createdAtCondition.gte = filters.startDate;
    }
    if (filters.endDate) {
      createdAtCondition.lte = filters.endDate;
    }
    whereConditions.createdAt = createdAtCondition;
  }

  const faultyReturns = await db.faultyReturn.findMany({
    where: whereConditions,
    include: {
      product: true,
      variant: true,
      order: true,
      replacementOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number for client component serialization
  return faultyReturns.map((fr) => ({
    id: fr.id,
    returnNumber: fr.returnNumber,
    orderId: fr.orderId,
    orderNumber: fr.orderNumber,
    productId: fr.productId,
    variantId: fr.variantId,
    quantity: fr.quantity,
    faultyReason: fr.faultyReason,
    notes: fr.notes,
    status: fr.status,
    replacementOrderId: fr.replacementOrderId,
    createdAt: fr.createdAt,
    updatedAt: fr.updatedAt,
    product: {
      id: fr.product.id,
      name: fr.product.name,
      price: Number(fr.product.price),
      stock: fr.product.stock,
    },
    variant: fr.variant
      ? {
          id: fr.variant.id,
          flavour: fr.variant.flavour,
          stock: fr.variant.stock,
        }
      : null,
    order: fr.order
      ? {
          id: fr.order.id,
          orderNumber: fr.order.orderNumber,
          username: fr.order.username,
          status: fr.order.status,
          orderType: fr.order.orderType,
          manualDiscount: fr.order.manualDiscount
            ? Number(fr.order.manualDiscount)
            : null,
          totalOverride: fr.order.totalOverride
            ? Number(fr.order.totalOverride)
            : null,
        }
      : null,
    replacementOrder: fr.replacementOrder
      ? {
          id: fr.replacementOrder.id,
          orderNumber: fr.replacementOrder.orderNumber,
          username: fr.replacementOrder.username,
          status: fr.replacementOrder.status,
          orderType: fr.replacementOrder.orderType,
          manualDiscount: fr.replacementOrder.manualDiscount
            ? Number(fr.replacementOrder.manualDiscount)
            : null,
          totalOverride: fr.replacementOrder.totalOverride
            ? Number(fr.replacementOrder.totalOverride)
            : null,
        }
      : null,
  }));
}

export async function getFaultyLosses(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const faultyReturns = await db.faultyReturn.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      product: true,
    },
  });

  let preSaleLoss = 0;
  let postSaleLoss = 0;
  let totalLoss = 0;

  for (const fr of faultyReturns) {
    const loss = Number(fr.product.price) * fr.quantity;
    totalLoss += loss;

    if (fr.orderId) {
      postSaleLoss += loss;
    } else {
      preSaleLoss += loss;
    }
  }

  return {
    totalLoss,
    preSaleLoss,
    postSaleLoss,
    count: faultyReturns.length,
    preSaleCount: faultyReturns.filter((fr) => !fr.orderId).length,
    postSaleCount: faultyReturns.filter((fr) => fr.orderId).length,
  };
}
