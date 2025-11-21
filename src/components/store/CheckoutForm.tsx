"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BasketItem } from "@/types";
import { calculateOffers, type Offer } from "@/lib/offer-utils";

interface CheckoutFormProps {
  items: BasketItem[];
  offers?: Offer[];
  onSubmit: (
    username: string,
    items: BasketItem[],
  ) => Promise<{ id: string } | void>;
}

export default function CheckoutForm({
  items,
  offers = [],
  onSubmit,
}: CheckoutFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const basketTotal = calculateOffers(items, offers);
  const { subtotal, discounts, total, appliedOffers } = basketTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const order = await onSubmit(username, items);
      if (order && order.id) {
        router.push(`/store/order-confirmation/${order.id}`);
      } else {
        router.push("/store?success=true");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Checkout
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
          Order Summary
        </h2>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || "base"}`}
              className="flex justify-between items-start sm:items-center py-2 border-b border-gray-100 last:border-b-0 gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">
                  {item.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {item.quantity} × £{item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-sm sm:text-base flex-shrink-0">
                £{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {appliedOffers.length > 0 && (
          <div className="mb-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-green-700 mb-2">
              Applied Offers:
            </h3>
            <div className="space-y-2">
              {appliedOffers.map((offer) => (
                <div
                  key={offer.offerId}
                  className="text-sm bg-green-50 border border-green-200 rounded p-2"
                >
                  <div className="font-medium text-green-800">
                    {offer.offerName}
                  </div>
                  <div className="text-green-700">
                    Save £{offer.discount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">£{subtotal.toFixed(2)}</span>
          </div>
          {discounts > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discounts:</span>
              <span className="text-green-600 font-semibold">
                -£{discounts.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-base sm:text-lg font-semibold">Total:</span>
            <span className="text-xl sm:text-2xl font-bold">
              £{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="mb-6">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            placeholder="Enter your name"
            disabled={loading}
          />
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            This helps us identify who placed the order
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full sm:flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full sm:flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
