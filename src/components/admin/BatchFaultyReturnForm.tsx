"use client";

import { useState } from "react";
import { createBatchFaultyReturns } from "@/lib/actions";

interface SelectedItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantFlavour?: string;
  selectedQuantity: number;
}

interface BatchFaultyReturnFormProps {
  orderId: string;
  orderNumber: string;
  items: SelectedItem[];
  onClose: () => void;
  onSave: () => void;
}

export default function BatchFaultyReturnForm({
  orderId,
  orderNumber,
  items,
  onClose,
  onSave,
}: BatchFaultyReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faultyReason, setFaultyReason] = useState("");
  const [notes, setNotes] = useState("");

  const totalItems = items.reduce((sum, item) => sum + item.selectedQuantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!faultyReason.trim()) {
        throw new Error("Please provide a faulty reason");
      }

      await createBatchFaultyReturns(
        items.map((item) => ({
          orderId,
          orderNumber,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.selectedQuantity,
        })),
        faultyReason,
        notes || undefined
      );

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create returns");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Process Faulty Return
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Order: {orderNumber}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selected Items Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Items Being Returned ({items.length} item{items.length !== 1 ? 's' : ''}, {totalItems} total units)
              </h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.productName}
                      {item.variantFlavour && (
                        <span className="text-gray-500 ml-1">
                          ({item.variantFlavour})
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-gray-900">
                      × {item.selectedQuantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Faulty Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faulty Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={faultyReason}
                onChange={(e) => setFaultyReason(e.target.value)}
                rows={3}
                placeholder="Describe why the product(s) are faulty..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will apply to all selected items
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Returns...
                  </>
                ) : (
                  `Create ${items.length} Return${items.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
