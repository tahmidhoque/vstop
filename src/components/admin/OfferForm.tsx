"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
}

interface OfferFormProps {
  offer?: {
    id: string;
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  };
  products: Product[];
  onSubmit: (data: {
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function OfferForm({
  offer,
  products,
  onSubmit,
  onCancel,
}: OfferFormProps) {
  const [name, setName] = useState(offer?.name || "");
  const [description, setDescription] = useState(offer?.description || "");
  const [quantity, setQuantity] = useState(offer?.quantity.toString() || "2");
  const [price, setPrice] = useState(offer?.price.toString() || "");
  const [active, setActive] = useState(offer?.active ?? true);
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "",
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(offer?.productIds || []),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (isNaN(quantityNum) || quantityNum < 2) {
      setError("Quantity must be at least 2");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (selectedProductIds.size === 0) {
      setError("Please select at least one product");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        quantity: quantityNum,
        price: priceNum,
        active,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        productIds: Array.from(selectedProductIds),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Offer Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Any 2 for £15"
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          This will be displayed to customers
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about the offer"
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            min="2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="2"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Number of items required (e.g., 2 for "Any 2 for £X")
          </p>
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Offer Price (£) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="15.00"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Total price for the quantity (e.g., £15 for 2 items)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date (optional)
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date (optional)
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={loading}
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Only active offers will be applied to orders
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Eligible Products <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loading || products.length === 0}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedProductIds.size === products.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-gray-600 mb-2">
            No products available. Create products first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.has(product.id)}
                  onChange={() => handleToggleProduct(product.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-900">{product.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select products that qualify for this offer. The offer will apply to
          any combination of selected products.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          {loading ? "Saving..." : offer ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
