"use client";

import Link from "next/link";

interface StockBreakdown {
  physical: number;
  faulty: number;
  pending: number;
  available: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  visible?: boolean;
  stockBreakdown: StockBreakdown;
  variants?: Array<{
    id: string;
    flavour: string;
    stock: number;
    stockBreakdown: StockBreakdown;
  }>;
}

interface StockPageClientProps {
  products: Product[];
}

export default function StockPageClient({ products }: StockPageClientProps) {
  // Calculate total physical stock for each product
  const calculateTotalPhysical = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (total, variant) => total + variant.stockBreakdown.physical,
        0
      );
    }
    return product.stockBreakdown.physical;
  };

  // Calculate total faulty stock for each product
  const calculateTotalFaulty = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (total, variant) => total + variant.stockBreakdown.faulty,
        0
      );
    }
    return product.stockBreakdown.faulty;
  };

  // Calculate total pending stock for each product
  const calculateTotalPending = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (total, variant) => total + variant.stockBreakdown.pending,
        0
      );
    }
    return product.stockBreakdown.pending;
  };

  // Calculate total available stock for each product
  const calculateTotalAvailable = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce(
        (total, variant) => total + variant.stockBreakdown.available,
        0
      );
    }
    return product.stockBreakdown.available;
  };

  // Format stock breakdown display
  const formatStockBreakdown = (breakdown: StockBreakdown): string => {
    return `Physical: ${breakdown.physical} | Faulty: ${breakdown.faulty} | Pending: ${breakdown.pending} | Available: ${breakdown.available}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3 sm:mb-4 inline-block min-h-[44px] flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Stock Check
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-600">
              <p>No products found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {products.map((product) => (
                  <div key={product.id} className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          {product.visible === false && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        {product.variants && product.variants.length > 0 ? (
                          <div className="mt-3">
                            <div
                              className={`text-sm font-semibold mb-3 py-2 px-3 rounded ${
                                calculateTotalAvailable(product) <= 5
                                  ? "text-orange-600 bg-orange-50"
                                  : "text-gray-900 bg-blue-50"
                              }`}
                            >
                              {formatStockBreakdown({
                                physical: calculateTotalPhysical(product),
                                faulty: calculateTotalFaulty(product),
                                pending: calculateTotalPending(product),
                                available: calculateTotalAvailable(product),
                              })}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-3">
                              Variants:
                            </div>
                            <div className="space-y-2.5">
                              {product.variants.map((variant) => (
                                <div key={variant.id} className="text-xs">
                                  <div className="font-medium text-gray-900 mb-1">
                                    {variant.flavour}:
                                  </div>
                                  <div
                                    className={`py-1.5 px-2 rounded ${
                                      variant.stockBreakdown.available <= 5
                                        ? "text-orange-600 font-medium bg-orange-50"
                                        : "text-gray-700 bg-gray-50"
                                    }`}
                                  >
                                    {formatStockBreakdown(variant.stockBreakdown)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div
                              className={`text-sm font-medium mt-3 py-2 px-3 rounded ${
                                product.stockBreakdown.available <= 5
                                  ? "text-orange-600 bg-orange-50"
                                  : "text-gray-700 bg-gray-50"
                              }`}
                            >
                              {formatStockBreakdown(product.stockBreakdown)}
                            </div>
                            {product.stockBreakdown.faulty > 0 && (
                              <p className="text-xs text-orange-600 mt-2 font-medium">
                                ⚠️ {product.stockBreakdown.faulty} faulty unit{product.stockBreakdown.faulty !== 1 ? 's' : ''} not sellable
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Stock Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 ${
                          product.visible === false ? "opacity-60" : ""
                        }`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-base font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.visible === false && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {product.variants && product.variants.length > 0 ? (
                            <div>
                              <div
                                className={`text-sm font-semibold mb-3 py-2 px-3 rounded inline-block ${
                                  calculateTotalAvailable(product) <= 5
                                    ? "text-orange-600 bg-orange-50"
                                    : "text-gray-900 bg-blue-50"
                                }`}
                              >
                                {formatStockBreakdown({
                                  physical: calculateTotalPhysical(product),
                                  faulty: calculateTotalFaulty(product),
                                  pending: calculateTotalPending(product),
                                  available: calculateTotalAvailable(product),
                                })}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 mb-3 mt-4">
                                Variants:
                              </div>
                              <div className="space-y-2">
                                {product.variants.map((variant) => (
                                  <div key={variant.id} className="text-sm">
                                    <div className="font-medium text-gray-900 mb-1">
                                      {variant.flavour}:
                                    </div>
                                    <div
                                      className={`py-2 px-3 rounded ${
                                        variant.stockBreakdown.available <= 5
                                          ? "text-orange-600 font-medium bg-orange-50"
                                          : "text-gray-700 bg-gray-50"
                                      }`}
                                    >
                                      {formatStockBreakdown(variant.stockBreakdown)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div
                                className={`text-sm font-medium py-2 px-3 rounded inline-block ${
                                  product.stockBreakdown.available <= 5
                                    ? "text-orange-600 bg-orange-50"
                                    : "text-gray-900 bg-gray-50"
                                }`}
                              >
                                {formatStockBreakdown(product.stockBreakdown)}
                              </div>
                              {product.stockBreakdown.faulty > 0 && (
                                <p className="text-xs text-orange-600 mt-2 font-medium">
                                  ⚠️ {product.stockBreakdown.faulty} faulty unit{product.stockBreakdown.faulty !== 1 ? 's' : ''} not sellable
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

