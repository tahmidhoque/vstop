"use client";

import React, { useState } from "react";
import { createReplacementOrder } from "@/lib/actions";
import type { FaultyReturn } from "@/types";

interface CreateReplacementOrderModalProps {
  faultyReturn: FaultyReturn;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReplacementOrderModal({
  faultyReturn,
  onClose,
  onSuccess,
}: CreateReplacementOrderModalProps) {
  const [username, setUsername] = useState(
    faultyReturn.order?.username || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!username.trim()) {
        throw new Error("Please enter a customer name");
      }

      await createReplacementOrder(faultyReturn.id, username);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create replacement order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Create Replacement Order
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Replacement Details
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Product:</strong> {faultyReturn.product.name}
                  {faultyReturn.variant && ` (${faultyReturn.variant.flavour})`}
                </p>
                <p>
                  <strong>Quantity:</strong> {faultyReturn.quantity}
                </p>
                <p>
                  <strong>Return #:</strong> {faultyReturn.returnNumber}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Customer Name
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will create a free replacement order
                (£0.00) and automatically deduct {faultyReturn.quantity} unit(s)
                from stock. The order will be marked as a replacement and will not
                count towards revenue.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 min-h-[44px] font-medium transition-colours"
              >
                {isSubmitting ? "Creating..." : "Create Replacement Order"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:bg-gray-100 min-h-[44px] font-medium transition-colours"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
