"use client";

import { useState, useEffect } from "react";
import { createFaultyReturn } from "@/lib/actions";

interface Product {
  id: string;
  name: string;
  variants?: Array<{
    id: string;
    flavour: string;
  }>;
}

interface FaultyReturnFormProps {
  onClose: () => void;
  onSave: () => void;
  prefilledData?: {
    orderId?: string;
    orderNumber?: string;
    productId?: string;
    variantId?: string;
    maxQuantity?: number;
  };
}

export default function FaultyReturnForm({
  onClose,
  onSave,
  prefilledData,
}: FaultyReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    orderId: prefilledData?.orderId || "",
    orderNumber: prefilledData?.orderNumber || "",
    productId: prefilledData?.productId || "",
    variantId: prefilledData?.variantId || "",
    quantity: 1,
    faultyReason: "",
    notes: "",
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const hasVariants = selectedProduct?.variants && selectedProduct.variants.length > 0;

  useEffect(() => {
    // Fetch products for the dropdown
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setLoadingProducts(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.productId) {
        throw new Error("Please select a product");
      }

      if (hasVariants && !formData.variantId) {
        throw new Error("Please select a variant");
      }

      if (!formData.faultyReason.trim()) {
        throw new Error("Please provide a faulty reason");
      }

      if (formData.quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }

      await createFaultyReturn({
        orderId: formData.orderId || undefined,
        orderNumber: formData.orderNumber || undefined,
        productId: formData.productId,
        variantId: formData.variantId || undefined,
        quantity: formData.quantity,
        faultyReason: formData.faultyReason,
        notes: formData.notes || undefined,
      });

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create return");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Log Faulty Return
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number (Optional)
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) =>
                  setFormData({ ...formData, orderNumber: e.target.value })
                }
                placeholder="e.g., ORD-000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!!prefilledData?.orderNumber}
              />
              <p className="text-xs text-gray-500 mt-1">
                Link this return to an existing order
              </p>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              {loadingProducts ? (
                <div className="text-sm text-gray-500">Loading products...</div>
              ) : (
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      variantId: "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!prefilledData?.productId}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Variant Selection (if applicable) */}
            {hasVariants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.variantId}
                  onChange={(e) =>
                    setFormData({ ...formData, variantId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!prefilledData?.variantId}
                >
                  <option value="">Select a variant</option>
                  {selectedProduct?.variants?.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.flavour}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={prefilledData?.maxQuantity}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {prefilledData?.maxQuantity && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {prefilledData.maxQuantity}
                </p>
              )}
            </div>

            {/* Faulty Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faulty Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.faultyReason}
                onChange={(e) =>
                  setFormData({ ...formData, faultyReason: e.target.value })
                }
                rows={3}
                placeholder="Describe why the product is faulty..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
                placeholder="Any additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center gap-2"
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
                    Creating...
                  </>
                ) : (
                  "Create Return"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
