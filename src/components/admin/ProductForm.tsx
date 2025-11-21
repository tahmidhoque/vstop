"use client";

import { useState, useEffect } from "react";

interface Variant {
  id?: string;
  flavour: string;
  stock: number;
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    variants?: Variant[];
  };
  onSubmit: (data: {
    name: string;
    price: number;
    stock: number;
    variants: Variant[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [stock, setStock] = useState(product?.stock.toString() || "0");
  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddVariant = () => {
    setVariants([...variants, { flavour: "", stock: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: "flavour" | "stock",
    value: string | number,
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: field === "stock" ? parseInt(String(value), 10) || 0 : value,
    };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError("Stock must be a non-negative number");
      return;
    }

    // Validate variants
    const validVariants = variants.filter((v) => v.flavour.trim() !== "");
    for (const variant of validVariants) {
      if (variant.stock < 0) {
        setError("Variant stock must be non-negative");
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: priceNum,
        stock: stockNum,
        variants: validVariants,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
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
          Product Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Price (£)
        </label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="stock"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Base Stock Quantity (if no variants)
        </label>
        <input
          id="stock"
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
          disabled={loading}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Flavour Variants (optional)
          </label>
          <button
            type="button"
            onClick={handleAddVariant}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Variant
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="text-sm text-gray-600 mb-2">
            No variants. Product will use base stock.
          </p>
        ) : (
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Flavour name (e.g., Vanilla, Chocolate)"
                    value={variant.flavour}
                    onChange={(e) =>
                      handleVariantChange(index, "flavour", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2 min-h-[44px]"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "stock",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  disabled={loading}
                  className="px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
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
          {loading ? "Saving..." : product ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
