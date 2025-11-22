"use client";

import { useState, useEffect } from "react";
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
  const [quantity, setQuantity] = useState(1);

  // Calculate display stock - use variant stock if selected, otherwise base stock
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : stock;

  const isOutOfStock = displayStock === 0;
  const maxQuantity = Math.max(1, displayStock);

  // Reset quantity when variant changes or stock changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id, displayStock]);

  const handleQuantityChange = (newQuantity: number) => {
    // Clamp quantity between 1 and available stock
    const clampedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    setQuantity(clampedQuantity);
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for better UX
    if (value === "") {
      setQuantity(1);
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      handleQuantityChange(numValue);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const handleAdd = () => {
    if (displayStock > 0 && quantity > 0) {
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
        quantity: Math.min(quantity, maxQuantity),
        stock: displayStock,
        variantId: selectedVariant?.id,
        flavour: selectedVariant?.flavour,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 min-w-0 truncate">
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
        <div className="mb-3 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Flavour:
          </label>
          <select
            value={selectedVariant?.id || ""}
            onChange={(e) => {
              const variant = variants.find((v) => v.id === e.target.value);
              setSelectedVariant(variant || null);
            }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px] touch-manipulation"
            style={{ touchAction: 'manipulation' }}
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

      <div className="mt-auto pt-2 pb-1">
        <div className="flex items-baseline justify-between mb-3 gap-2">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            £{Number(price).toFixed(2)}
          </p>
          <span
            className={`text-xs font-medium ${
              isOutOfStock
                ? "text-red-600"
                : displayStock <= 5
                  ? "text-orange-600"
                  : "text-gray-500"
            }`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : displayStock > 5
                ? "In Stock"
                : `${displayStock} left`}
          </span>
        </div>

        {/* Quantity Selector - Compact Design */}
        {!isOutOfStock && (
          <div className="mb-3">
            <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="px-3 py-2.5 text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                style={{ touchAction: 'manipulation' }}
                aria-label="Decrease quantity"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityInput}
                onBlur={(e) => {
                  if (e.target.value === "" || parseInt(e.target.value, 10) < 1) {
                    setQuantity(1);
                  }
                }}
                className="w-14 text-center border-x border-gray-300 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[44px] touch-manipulation bg-white"
                style={{ touchAction: 'manipulation' }}
                aria-label="Quantity"
              />
              <button
                onClick={incrementQuantity}
                disabled={quantity >= maxQuantity}
                className="px-3 py-2.5 text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                style={{ touchAction: 'manipulation' }}
                aria-label="Increase quantity"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
          className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] active:bg-blue-800 touch-manipulation shadow-sm"
          style={{ touchAction: 'manipulation' }}
        >
          {quantity > 1 ? `Add ${quantity} to Basket` : "Add to Basket"}
        </button>
      </div>
    </div>
  );
}
