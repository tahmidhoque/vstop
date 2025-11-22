"use client";

import { useState, useEffect } from "react";
import type { BasketItem } from "@/types";
import { calculateOffers, type Offer } from "@/lib/offer-utils";

interface BasketProps {
  items: BasketItem[];
  offers?: Offer[];
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  onRemove: (productId: string, variantId?: string) => void;
  onCheckout: () => void;
}

export default function Basket({
  items,
  offers = [],
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: BasketProps) {
  const [isOpen, setIsOpen] = useState(false);

  const basketTotal = calculateOffers(items, offers);
  const { subtotal, discounts, total, appliedOffers } = basketTotal;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <>
        {/* Mobile empty basket - just show the button, no fixed message */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-4 right-4 md:hidden bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 min-h-[56px] min-w-[56px] z-40 active:bg-blue-700 transition-all duration-300 ease-in-out touch-manipulation ${
            isOpen
              ? "opacity-0 scale-90 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
          style={{ touchAction: 'manipulation' }}
          aria-label="Open basket"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </button>
        {/* Desktop empty basket */}
        <div className="hidden md:block w-80 bg-white border-l border-gray-200 h-full sticky top-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Basket</h2>
          </div>
          <div className="text-center text-gray-600 py-8">
            <p>Your basket is empty</p>
          </div>
        </div>
        {/* Mobile empty basket modal */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto transform transition-transform duration-300 ease-out ${
              isOpen ? "translate-y-0" : "translate-y-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">Basket</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close basket"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="text-center text-gray-600 py-12 px-4">
              <p>Your basket is empty</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile basket toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 md:hidden bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 min-h-[56px] min-w-[56px] z-40 active:bg-blue-700 transition-all duration-300 ease-in-out touch-manipulation ${
          isOpen
            ? "opacity-0 scale-90 pointer-events-none"
            : "opacity-100 scale-100"
        }`}
        style={{ touchAction: 'manipulation' }}
        aria-label="Open basket"
      >
        <span className="hidden sm:inline">Basket</span>
        {itemCount > 0 && (
          <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold min-w-[20px] text-center">
            {itemCount}
          </span>
        )}
        {itemCount === 0 && (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )}
      </button>

      {/* Basket panel */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto transform transition-transform duration-300 ease-out ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">Basket</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close basket"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <BasketContent
            items={items}
            subtotal={subtotal}
            discounts={discounts}
            total={total}
            appliedOffers={appliedOffers}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            onCheckout={() => {
              onCheckout();
              setIsOpen(false);
            }}
          />
        </div>
      </div>

      {/* Desktop basket sidebar */}
      <div className="hidden md:block w-80 bg-white border-l border-gray-200 h-full sticky top-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Basket</h2>
        </div>
        <BasketContent
          items={items}
          subtotal={subtotal}
          discounts={discounts}
          total={total}
          appliedOffers={appliedOffers}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onCheckout={onCheckout}
        />
      </div>
    </>
  );
}

function BasketContent({
  items,
  subtotal,
  discounts,
  total,
  appliedOffers,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: {
  items: BasketItem[];
  subtotal: number;
  discounts: number;
  total: number;
  appliedOffers: Array<{
    offerId: string;
    offerName: string;
    appliedQuantity: number;
    discount: number;
    items: BasketItem[];
  }>;
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  onRemove: (productId: string, variantId?: string) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId || "base"}`}
            className="border-b border-gray-200 pb-4 last:border-b-0"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  £{item.price.toFixed(2)} each
                </p>
              </div>
              <button
                onClick={() => onRemove(item.productId, item.variantId)}
                className="text-red-600 hover:text-red-700 active:text-red-800 text-sm font-medium whitespace-nowrap px-2 py-1 min-h-[44px] flex items-center transition-colors"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-1">
                <button
                  onClick={() =>
                    onUpdateQuantity(
                      item.productId,
                      Math.max(0, item.quantity - 1),
                      item.variantId,
                    )
                  }
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 min-h-[44px] min-w-[44px] text-lg sm:text-base transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium text-base min-w-[48px]">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    onUpdateQuantity(
                      item.productId,
                      Math.min(item.stock, item.quantity + 1),
                      item.variantId,
                    )
                  }
                  disabled={item.quantity >= item.stock}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] text-lg sm:text-base transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="ml-auto font-semibold text-base sm:text-sm text-gray-900 min-w-[70px] text-right">
                £{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {appliedOffers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-green-700 mb-2">
              Applied Offers:
            </h4>
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
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="space-y-2 mb-4">
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
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold">£{total.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
