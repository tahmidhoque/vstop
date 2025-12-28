export type { PasswordType, OrderStatus, ReturnStatus, OrderType } from "@/generated/enums";
import type { OrderStatus, ReturnStatus, OrderType } from "@/generated/enums";

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
  orderType: OrderType;
  manualDiscount?: number | null;
  totalOverride?: number | null;
  createdAt: Date;
  updatedAt: Date;
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
  faultyReturns?: Array<{
    id: string;
    returnNumber: string;
    quantity: number;
    faultyReason: string;
    status: ReturnStatus;
    product: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

export type FaultyReturnType = "PRE_SALE" | "POST_SALE";

export interface FaultyReturn {
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
    stock: number;
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
    orderType: OrderType;
    manualDiscount: number | null;
    totalOverride: number | null;
  } | null;
  replacementOrder?: {
    id: string;
    orderNumber: string;
    username: string;
    status: OrderStatus;
    orderType: OrderType;
    manualDiscount: number | null;
    totalOverride: number | null;
  } | null;
}

export interface FaultyLossSummary {
  totalLoss: number;
  preSaleLoss: number;
  postSaleLoss: number;
  count: number;
  preSaleCount: number;
  postSaleCount: number;
}

export interface ReportsData {
  totalOrders: number;
  cancelledOrders: number;
  fulfilledOrders: number;
  unfulfilledOrders: number;
  totalSales: number;
  orders: OrderWithItems[];
  replacementOrders?: OrderWithItems[];
  faultyLosses?: FaultyLossSummary;
  productBreakdown?: ProductBreakdown[];
}

export interface ProductBreakdown {
  productId: string;
  variantId: string | null;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}
