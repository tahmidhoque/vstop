"use client";

import { useState, useEffect } from "react";
import { createPersonalUseOrder, getProducts } from "@/lib/actions";
import type { BasketItem } from "@/types";

interface PersonalUseOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PersonalUseOrderModal({
  onClose,
  onSuccess,
}: PersonalUseOrderModalProps) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      variants?: Array<{ id: string; flavour: string; stock: number }>;
    }>
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts(true); // includeHidden: true for admin
      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
          variants: p.variants?.map(
            (v: { id: string; flavour: string; stock: number }) => ({
              id: v.id,
              flavour: v.flavour,
              stock: v.stock,
            }),
          ),
        })),
      );
    }

    loadProducts();
  }, []);

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const hasVariants = selectedProductData?.variants && selectedProductData.variants.length > 0;

  const addItem = () => {
    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    // Check if product has variants and one is selected
    if (hasVariants && !selectedVariant) {
      setError("Please select a flavour");
      return;
    }

    let stock = product.stock;
    let flavour: string | undefined = undefined;
    let variantId: string | undefined = undefined;
    let name = product.name;

    if (hasVariants && selectedVariant) {
      const variant = product.variants?.find((v) => v.id === selectedVariant);
      if (variant) {
        stock = variant.stock;
        flavour = variant.flavour;
        variantId = variant.id;
        name = `${product.name} (${variant.flavour})`;
      }
    }

    if (quantity > stock) {
      setError(`Insufficient stock. Only ${stock} available.`);
      return;
    }

    // Check if item already exists
    const existingItemIndex = items.findIndex(
      (item) =>
        item.productId === selectedProduct &&
        item.variantId === (variantId || undefined),
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          productId: selectedProduct,
          name,
          price: product.price,
          quantity,
          stock,
          variantId,
          flavour,
        },
      ]);
    }

    // Reset form
    setSelectedProduct("");
    setSelectedVariant("");
    setQuantity(1);
    setError("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (newQuantity > item.stock) {
      setError(`Insufficient stock for ${item.name}. Only ${item.stock} available.`);
      return;
    }

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    newItems[index].quantity = newQuantity;
    setItems(newItems);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createPersonalUseOrder(items);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Create Personal Use Order
          </h2>
          <p className="text-sm text-purple-700 mt-1">
            Track stock taken for personal use (not counted in revenue)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Add Item Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Add Item
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant("");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[44px]"
                  disabled={loading}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {hasVariants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flavour
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[44px]"
                    disabled={loading}
                  >
                    <option value="">Select a flavour</option>
                    {selectedProductData?.variants?.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.flavour} (Stock: {variant.stock})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[44px]"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[44px] transition-colors"
              disabled={loading}
            >
              Add Item
            </button>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Items ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Stock available: {item.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(index, parseInt(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center min-h-[44px]"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded min-h-[44px] transition-colors"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
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
              disabled={loading || items.length === 0}
              className="w-full sm:flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center gap-2"
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
                "Create Personal Use Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

