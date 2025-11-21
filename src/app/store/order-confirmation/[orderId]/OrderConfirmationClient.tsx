"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrder } from "@/lib/actions";

interface OrderConfirmationClientProps {
  orderId: string;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  flavour: string | null;
  quantity: number;
  priceAtTime: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
  variant: {
    id: string;
    flavour: string;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  username: string;
  status: string;
  createdAt: Date;
  items: OrderItem[];
}

export default function OrderConfirmationClient({
  orderId,
}: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await getOrder(orderId);
        if (!orderData) {
          setError("Order not found");
          return;
        }
        setOrder(orderData as Order);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-4">
            <p className="text-sm sm:text-base text-red-700 font-medium">
              {error || "Order not found"}
            </p>
          </div>
          <button
            onClick={() => router.push("/store")}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals (simplified - assuming no offers applied at confirmation)
  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
    0,
  );
  const total = subtotal;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-green-800">
              Order Confirmed!
            </h1>
          </div>
          <p className="text-sm sm:text-base text-green-700">
            Thank you for your order, {order.username}. Your order has been
            received and is being processed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Order Details</h2>

          <div className="space-y-3 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-gray-600">Order Number:</span>
              <span className="font-mono font-semibold text-sm sm:text-base text-gray-900 break-all sm:break-normal">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm sm:text-base text-gray-600">Order Date:</span>
              <span className="text-sm sm:text-base text-gray-900">
                {formatDate(order.createdAt)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm sm:text-base text-gray-600">Status:</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto">
                {order.status}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm sm:text-base font-semibold mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-2.5 border-b border-gray-100 last:border-b-0 gap-2 sm:gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate mb-1 sm:mb-0">
                      {item.product.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Flavour: {item.variant.flavour}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {item.quantity} × £{Number(item.priceAtTime).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm sm:text-base flex-shrink-0 text-gray-900 self-end sm:self-auto">
                    £{(Number(item.priceAtTime) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-medium">£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base sm:text-lg font-semibold">
                  Total:
                </span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  £{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/store")}
            className="w-full sm:flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
