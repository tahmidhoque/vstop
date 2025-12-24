"use client";

import React, { useState, useEffect } from "react";
import { createFaultyReturn, getProducts, getOrders } from "@/lib/actions";

interface FaultyReturnFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaultyReturnForm({
  onSuccess,
  onCancel,
}: FaultyReturnFormProps) {
  const [type, setType] = useState<"PRE_SALE" | "POST_SALE">("PRE_SALE");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [faultyReason, setFaultyReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [productsData, ordersData] = await Promise.all([
        getProducts(true),
        getOrders(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product);
      setVariantId(""); // Reset variant when product changes
    } else {
      setSelectedProduct(null);
    }
  }, [productId, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!productId) {
        throw new Error("Please select a product");
      }

      if (!faultyReason.trim()) {
        throw new Error("Please provide a reason for the faulty item");
      }

      if (type === "POST_SALE" && !orderId) {
        throw new Error("Please select an order for post-sale returns");
      }

      await createFaultyReturn({
        orderId: type === "POST_SALE" ? orderId : null,
        orderNumber: type === "POST_SALE" ? orderNumber : null,
        productId,
        variantId: variantId || null,
        quantity,
        faultyReason,
        notes: notes.trim() || null,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create faulty return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Report Faulty Item
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("PRE_SALE")}
              className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-colours min-h-[44px] ${
                type === "PRE_SALE"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Pre-Sale Faulty Stock
            </button>
            <button
              type="button"
              onClick={() => setType("POST_SALE")}
              className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-colours min-h-[44px] ${
                type === "POST_SALE"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Post-Sale Return
            </button>
          </div>
        </div>

        {/* Order Selection (Post-Sale Only) */}
        {type === "POST_SALE" && (
          <div>
            <label
              htmlFor="order"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Order
            </label>
            <select
              id="order"
              value={orderId}
              onChange={(e) => {
                const selectedOrder = orders.find(
                  (o) => o.id === e.target.value,
                );
                setOrderId(e.target.value);
                setOrderNumber(selectedOrder?.orderNumber || "");
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              required={type === "POST_SALE"}
            >
              <option value="">Select an order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.username} (
                  {new Date(order.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Selection */}
        <div>
          <label
            htmlFor="product"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Product
          </label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - £{product.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Variant Selection (if product has variants) */}
        {selectedProduct && selectedProduct.variants.length > 0 && (
          <div>
            <label
              htmlFor="variant"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Variant
            </label>
            <select
              id="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            >
              <option value="">Base Product</option>
              {selectedProduct.variants.map((variant: any) => (
                <option key={variant.id} value={variant.id}>
                  {variant.flavour} (Stock: {variant.stock})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            required
          />
        </div>

        {/* Faulty Reason */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Faulty Reason
          </label>
          <input
            type="text"
            id="reason"
            value={faultyReason}
            onChange={(e) => setFaultyReason(e.target.value)}
            placeholder="e.g., Damaged packaging, Expired, Defective"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional details..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Warning for Pre-Sale */}
        {type === "PRE_SALE" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will automatically deduct {quantity}{" "}
              unit(s) from stock.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 min-h-[44px] font-medium transition-colours"
          >
            {isSubmitting ? "Creating..." : "Create Faulty Return"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:bg-gray-100 min-h-[44px] font-medium transition-colours"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
