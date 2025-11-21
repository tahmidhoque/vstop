"use client";

import { useState, useEffect } from "react";
import { updateOrder, getProducts, getOffers } from "@/lib/actions";
import { calculateOffers, calculateDiscountedPrices, type Offer } from "@/lib/offer-utils";
import type { OrderWithItems } from "@/types";
import type { BasketItem } from "@/types";

interface OrderEditModalProps {
  order: OrderWithItems;
  onClose: () => void;
  onSave: () => void;
}

export default function OrderEditModal({
  order,
  onClose,
  onSave,
}: OrderEditModalProps) {
  const [username, setUsername] = useState(order.username);
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
  const [offers, setOffers] = useState<Offer[]>([]);
  const [manualDiscount, setManualDiscount] = useState<number>(
    order.manualDiscount ? Number(order.manualDiscount) : 0
  );
  const [totalOverride, setTotalOverride] = useState<number | null>(
    order.totalOverride ? Number(order.totalOverride) : null
  );
  const [useTotalOverride, setUseTotalOverride] = useState<boolean>(
    !!order.totalOverride
  );
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

    async function loadOffers() {
      const offersData = await getOffers();
      setOffers(offersData);
    }

    loadProducts();
    loadOffers();

    // Convert order items to basket items
    // Use priceAtTime which may already include discounts
    setItems(
      order.items.map((item) => ({
        productId: item.product.id,
        name: item.flavour
          ? `${item.product.name} (${item.flavour})`
          : item.product.name,
        price: Number(item.priceAtTime), // Keep the discounted price from the order
        quantity: item.quantity,
        stock: 0, // Will be updated when products load
        variantId: item.variant?.id,
        flavour: item.flavour || undefined,
      })),
    );
  }, [order]);

  useEffect(() => {
    // Update stock for items, but preserve prices (they may be manually edited or discounted)
    setItems((currentItems) =>
      currentItems.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;

        // If item has a variant, use variant stock
        if (item.variantId && product.variants) {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (variant) {
            return {
              ...item,
              stock: variant.stock + item.quantity,
              // Only update price if it hasn't been manually set (keep existing price)
            };
          }
        }

        // Use base product stock or sum of variant stocks
        const stock =
          product.variants && product.variants.length > 0
            ? product.variants.reduce((sum, v) => sum + v.stock, 0) +
              item.quantity
            : product.stock + item.quantity;

        return {
          ...item,
          stock,
          // Only update price if it hasn't been manually set (keep existing price)
        };
      }),
    );
  }, [products]);

  const handleAddProduct = (productId: string, variantId?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // If product has variants, require variant selection
    if (product.variants && product.variants.length > 0 && !variantId) {
      return; // Can't add product with variants without selecting one
    }

    const variant = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : null;

    const displayName = variant
      ? `${product.name} (${variant.flavour})`
      : product.name;

    const itemStock = variant ? variant.stock : product.stock;

    const existing = items.find(
      (i) => i.productId === productId && i.variantId === variantId,
    );
    if (existing) {
      setItems((current) =>
        current.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i,
        ),
      );
    } else {
      setItems((current) => [
        ...current,
        {
          productId: product.id,
          name: displayName,
          price: product.price,
          quantity: 1,
          stock: itemStock,
          variantId: variant?.id,
          flavour: variant?.flavour,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => {
    if (quantity === 0) {
      setItems((current) =>
        current.filter(
          (i) => !(i.productId === productId && i.variantId === variantId),
        ),
      );
    } else {
      setItems((current) =>
        current.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: Math.min(quantity, item.stock) }
            : item,
        ),
      );
    }
  };

  const handleRemove = (productId: string, variantId?: string) => {
    setItems((current) =>
      current.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      ),
    );
  };

  const handleUpdateItemPrice = (
    productId: string,
    variantId: string | undefined,
    newPrice: number,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, price: Math.max(0, newPrice) }
          : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateOrder(
        order.id,
        username,
        items,
        manualDiscount > 0 ? manualDiscount : null,
        useTotalOverride && totalOverride !== null ? totalOverride : null,
      );
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  // Calculate offers using current product prices (for display purposes)
  // Create items with current product prices for offer calculation
  const itemsForOfferCalculation = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      price: product ? product.price : item.price, // Use current product price for offer calculation
    };
  });

  const basketTotal = calculateOffers(itemsForOfferCalculation, offers);
  
  // Subtotal uses the actual item prices (which may be manually edited or already discounted)
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  
  // Offer discounts are calculated from product prices (for informational display)
  const offerDiscounts = basketTotal.discounts;
  
  // Calculate what the subtotal would be at current product prices
  const subtotalAtProductPrices = itemsForOfferCalculation.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  
  // The total after offers (if prices were at product prices)
  const totalAfterOffers = subtotalAtProductPrices - offerDiscounts;
  
  // Since items may have manually edited prices or already discounted prices,
  // we apply the manual discount directly to the subtotal
  const totalAfterManualDiscount = subtotal - manualDiscount;
  const finalTotal = useTotalOverride && totalOverride !== null
    ? totalOverride
    : totalAfterManualDiscount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Edit Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1">
          <div className="mb-6">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Product
            </label>
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  // Format: "productId" or "productId:variantId"
                  const [productId, variantId] = value.split(":");
                  handleAddProduct(productId, variantId);
                  e.target.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] text-base"
              disabled={loading}
            >
              <option value="">Select a product...</option>
              {products.map((product) => {
                if (product.variants && product.variants.length > 0) {
                  return (
                    <optgroup
                      key={product.id}
                      label={`${product.name} - £${product.price.toFixed(2)}`}
                    >
                      {product.variants.map((variant) => (
                        <option
                          key={variant.id}
                          value={`${product.id}:${variant.id}`}
                        >
                          {variant.flavour} (
                          {variant.stock > 5
                            ? "In Stock"
                            : `${variant.stock} available`}
                          )
                        </option>
                      ))}
                    </optgroup>
                  );
                }
                return (
                  <option key={product.id} value={product.id}>
                    {product.name} - £{product.price.toFixed(2)} (
                    {product.stock > 5
                      ? "In Stock"
                      : `${product.stock} available`}
                    )
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Order Items
            </h3>
            {items.length === 0 ? (
              <p className="text-gray-600 text-sm">No items in order</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 mb-2 sm:mb-1 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          Unit Price:
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500">£</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price.toFixed(2)}
                            onChange={(e) =>
                              handleUpdateItemPrice(
                                item.productId,
                                item.variantId,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="flex-1 sm:w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                            disabled={loading}
                          />
                          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            each
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2">
                      <div className="flex items-center gap-2 sm:gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variantId,
                            )
                          }
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] text-lg sm:text-base transition-colors"
                          disabled={loading}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium text-base min-w-[48px]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variantId,
                            )
                          }
                          disabled={item.quantity >= item.stock || loading}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] text-lg sm:text-base transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="font-semibold text-base sm:text-base flex-shrink-0 min-w-[70px] text-right">
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(item.productId, item.variantId)
                          }
                          className="text-red-600 hover:text-red-700 active:text-red-800 text-sm font-medium min-h-[44px] px-3 py-2 whitespace-nowrap transition-colors"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discounts and Totals Section */}
          <div className="mb-6 p-4 sm:p-5 bg-gray-50 rounded-lg space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-medium">£{subtotal.toFixed(2)}</span>
              </div>

              {basketTotal.appliedOffers.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs sm:text-sm font-medium text-green-700 mb-2">
                    Applied Offers:
                  </div>
                  <div className="space-y-1 mb-2">
                    {basketTotal.appliedOffers.map((offer) => (
                      <div
                        key={offer.offerId}
                        className="text-xs sm:text-sm text-green-600"
                      >
                        {offer.offerName}: -£{offer.discount.toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm sm:text-base mt-3 pt-2 border-t border-gray-300">
                    <span className="text-green-600">Offer Discounts:</span>
                    <span className="text-green-600 font-semibold">
                      -£{offerDiscounts.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {offerDiscounts > 0 && (
                <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-gray-200">
                  <span className="text-gray-600">After Offers:</span>
                  <span className="text-gray-900 font-medium">
                    £{totalAfterOffers.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label
                    htmlFor="manualDiscount"
                    className="text-sm sm:text-base font-medium text-gray-700"
                  >
                    Manual Discount:
                  </label>
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:max-w-[140px]">
                    <span className="text-sm text-gray-500">£</span>
                    <input
                      id="manualDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalAfterOffers}
                      value={manualDiscount.toFixed(2)}
                      onChange={(e) =>
                        setManualDiscount(
                          Math.max(
                            0,
                            Math.min(
                              totalAfterOffers,
                              parseFloat(e.target.value) || 0,
                            ),
                          ),
                        )
                      }
                      className="flex-1 sm:w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {!useTotalOverride && (
                <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-gray-200">
                  <span className="text-gray-600">After Manual Discount:</span>
                  <span className="text-gray-900 font-medium">
                    £{totalAfterManualDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <label className="flex items-center text-sm sm:text-base font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTotalOverride}
                      onChange={(e) => {
                        setUseTotalOverride(e.target.checked);
                        if (e.target.checked && totalOverride === null) {
                          setTotalOverride(totalAfterManualDiscount);
                        }
                      }}
                      className="mr-2 w-4 h-4"
                      disabled={loading}
                    />
                    Override Total:
                  </label>
                  {useTotalOverride && (
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:max-w-[140px]">
                      <span className="text-sm text-gray-500">£</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={
                          totalOverride !== null
                            ? totalOverride.toFixed(2)
                            : totalAfterManualDiscount.toFixed(2)
                        }
                        onChange={(e) =>
                          setTotalOverride(
                            Math.max(0, parseFloat(e.target.value) || 0),
                          )
                        }
                        className="flex-1 sm:w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 sm:pt-4 border-t-2 border-gray-300 mt-4">
                <span className="text-base sm:text-lg font-semibold">Final Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  £{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
