"use client";

import { useState } from "react";
import type { OrderWithItems } from "@/types";

interface SelectedItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantFlavour?: string;
  maxQuantity: number;
  selectedQuantity: number;
}

interface OrderItemSelectorProps {
  order: OrderWithItems;
  onClose: () => void;
  onSelect: (items: SelectedItem[]) => void;
}

export default function OrderItemSelector({
  order,
  onClose,
  onSelect,
}: OrderItemSelectorProps) {
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    new Map()
  );

  const handleToggleItem = (
    productId: string,
    productName: string,
    variantId: string | undefined,
    variantFlavour: string | undefined,
    maxQuantity: number
  ) => {
    const key = `${productId}-${variantId || "base"}`;
    const newSelected = new Map(selectedItems);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.set(key, {
        productId,
        productName,
        variantId,
        variantFlavour,
        maxQuantity,
        selectedQuantity: maxQuantity, // Default to full quantity
      });
    }

    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(key);
    if (item) {
      item.selectedQuantity = Math.min(Math.max(1, quantity), item.maxQuantity);
      newSelected.set(key, item);
      setSelectedItems(newSelected);
    }
  };

  const handleSubmit = () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to return");
      return;
    }

    onSelect(Array.from(selectedItems.values()));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Select Items to Return
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Order: {order.orderNumber} • {order.username}
          </p>

          <div className="space-y-3 mb-6">
            {order.items.map((item) => {
              const key = `${item.product.id}-${item.variant?.id || "base"}`;
              const isSelected = selectedItems.has(key);
              const selectedItem = selectedItems.get(key);

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        handleToggleItem(
                          item.product.id,
                          item.product.name,
                          item.variant?.id,
                          item.variant?.flavour || item.flavour || undefined,
                          item.quantity
                        )
                      }
                      className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                            {(item.variant?.flavour || item.flavour) && (
                              <span className="text-gray-600 ml-1">
                                ({item.variant?.flavour || item.flavour})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Ordered: {item.quantity} unit
                            {item.quantity !== 1 ? "s" : ""} @ £
                            {Number(item.priceAtTime).toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Return Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  key,
                                  (selectedItem?.selectedQuantity || 1) - 1
                                )
                              }
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedItem?.selectedQuantity || 1}
                              onChange={(e) =>
                                handleQuantityChange(
                                  key,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  key,
                                  (selectedItem?.selectedQuantity || 1) + 1
                                )
                              }
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600 ml-2">
                              of {item.quantity}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedItems.size > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900">
                Selected: {selectedItems.size} item
                {selectedItems.size !== 1 ? "s" : ""} (
                {Array.from(selectedItems.values()).reduce(
                  (sum, item) => sum + item.selectedQuantity,
                  0
                )}{" "}
                total units)
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedItems.size === 0}
              className="w-full sm:flex-1 px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Return Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
