export type { PasswordType, OrderStatus, ReturnStatus } from "@/generated/enums";
import type { OrderStatus, ReturnStatus } from "@/generated/enums";

export interface BasketItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  variantId?: string;
  flavour?: string;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  username: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  manualDiscount?: number | string | null;
  totalOverride?: number | string | null;
  items: Array<{
    id: string;
    quantity: number;
    priceAtTime: number | string;
    flavour?: string | null;
    product: {
      id: string;
      name: string;
    };
    variant?: {
      id: string;
      flavour: string;
      stock: number;
    } | null;
  }>;
}

export interface ProductBreakdownVariant {
  variantId: string | null;
  variantFlavour: string | null;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface ProductBreakdown {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  variants: ProductBreakdownVariant[];
}

export interface ReportsData {
  totalOrders: number;
  cancelledOrders: number;
  fulfilledOrders: number;
  unfulfilledOrders: number;
  totalSales: number;
  orders: OrderWithItems[];
  productBreakdown: ProductBreakdown[];
}

export interface FaultyReturnWithRelations {
  id: string;
  returnNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  productId: string;
  variantId: string | null;
  quantity: number;
  faultyReason: string;
  notes: string | null;
  status: ReturnStatus;
  replacementOrderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
  };
  variant?: {
    id: string;
    flavour: string;
    stock: number;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    username: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  replacementOrder?: {
    id: string;
    orderNumber: string;
    username: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export interface StockBreakdownWithFaulty {
  physical: number;
  faulty: number;
  pending: number;
  available: number;
}
