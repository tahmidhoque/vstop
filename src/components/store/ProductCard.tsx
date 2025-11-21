"use client";

import { useState } from "react";
import type { BasketItem } from "@/types";

interface Variant {
  id: string;
  flavour: string;
  stock: number;
}

interface Offer {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  price: number;
  active: boolean;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  variants?: Variant[];
  offers?: Offer[];
  onAddToBasket: (item: BasketItem) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  stock,
  variants = [],
  offers = [],
  onAddToBasket,
}: ProductCardProps) {
  // Get active offers
  const activeOffers = offers.filter((offer) => offer.active);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? null : null,
  );

  // Calculate display stock - use variant stock if selected, otherwise base stock
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : stock;

  const isOutOfStock = displayStock === 0;

  const handleAdd = () => {
    if (displayStock > 0) {
      // If product has variants but none selected, don't allow adding
      if (variants.length > 0 && !selectedVariant) {
        return;
      }

      const displayName = selectedVariant
        ? `${name} (${selectedVariant.flavour})`
        : name;

      onAddToBasket({
        productId: id,
        name: displayName,
        price: Number(price),
        quantity: 1,
        stock: displayStock,
        variantId: selectedVariant?.id,
        flavour: selectedVariant?.flavour,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col">
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">
          {name}
        </h3>
        {activeOffers.length > 0 && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {activeOffers.map((offer) => (
              <span
                key={offer.id}
                className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded whitespace-nowrap"
              >
                {offer.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {variants.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Flavour:
          </label>
          <select
            value={selectedVariant?.id || ""}
            onChange={(e) => {
              const variant = variants.find((v) => v.id === e.target.value);
              setSelectedVariant(variant || null);
            }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
          >
            <option value="">Choose a flavour...</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.flavour} (
                {variant.stock > 5 ? "In Stock" : `${variant.stock} available`})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          £{Number(price).toFixed(2)}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span
            className={`text-sm ${
              isOutOfStock
                ? "text-red-600"
                : displayStock <= 5
                  ? "text-orange-600"
                  : "text-gray-600"
            }`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : displayStock > 5
                ? "In Stock"
                : `${displayStock} available`}
          </span>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] active:bg-blue-800"
          >
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  );
}
