"use client";

import { useState } from "react";
import Link from "next/link";
import PersonalUseOrderModal from "@/components/admin/PersonalUseOrderModal";

interface Product {
  id: string;
  name: string;
  stock: number;
  visible?: boolean;
  variants?: Array<{ id: string; flavour: string; stock: number }>;
}

interface StockPageClientProps {
  products: Product[];
}

export default function StockPageClient({ products }: StockPageClientProps) {
  const [showPersonalUseModal, setShowPersonalUseModal] = useState(false);
  // Calculate total stock for each product
  const calculateTotalStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => total + variant.stock, 0);
    }
    return product.stock || 0;
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
        {/* Quick Actions */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowPersonalUseModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 min-h-[44px] font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Create Personal Use Order
          </button>
          <Link
            href="/admin/faulty"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:bg-orange-800 min-h-[44px] font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report Faulty Stock
          </Link>
        </div>

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
                              className={`text-base font-semibold mb-3 py-2 px-3 rounded ${
                                calculateTotalStock(product) <= 5
                                  ? "text-orange-600 bg-orange-50"
                                  : "text-gray-900 bg-blue-50"
                              }`}
                            >
                              Total Stock: {calculateTotalStock(product)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-3">
                              Variants:
                            </div>
                            <div className="space-y-2.5">
                              {product.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className={`text-sm py-1.5 px-2 rounded ${
                                    variant.stock <= 5
                                      ? "text-orange-600 font-medium bg-orange-50"
                                      : "text-gray-700 bg-gray-50"
                                  }`}
                                >
                                  <span className="font-medium">
                                    {variant.flavour}:
                                  </span>{" "}
                                  {variant.stock} available
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`text-base font-medium mt-3 py-2 px-3 rounded ${
                              product.stock <= 5
                                ? "text-orange-600 bg-orange-50"
                                : "text-gray-700 bg-gray-50"
                            }`}
                          >
                            {product.stock} available
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
                                className={`text-base font-semibold mb-3 py-2 px-3 rounded inline-block ${
                                  calculateTotalStock(product) <= 5
                                    ? "text-orange-600 bg-orange-50"
                                    : "text-gray-900 bg-blue-50"
                                }`}
                              >
                                Total Stock: {calculateTotalStock(product)}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 mb-3 mt-4">
                                Variants:
                              </div>
                              <div className="space-y-2">
                                {product.variants.map((variant) => (
                                  <div
                                    key={variant.id}
                                    className={`text-sm py-2 px-3 rounded ${
                                      variant.stock <= 5
                                        ? "text-orange-600 font-medium bg-orange-50"
                                        : "text-gray-700 bg-gray-50"
                                    }`}
                                  >
                                    <span className="font-medium">
                                      {variant.flavour}:
                                    </span>{" "}
                                    {variant.stock} available
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`text-base font-medium py-2 px-3 rounded inline-block ${
                                product.stock <= 5
                                  ? "text-orange-600 bg-orange-50"
                                  : "text-gray-900 bg-gray-50"
                              }`}
                            >
                              {product.stock} available
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

      {/* Personal Use Order Modal */}
      {showPersonalUseModal && (
        <PersonalUseOrderModal
          onClose={() => setShowPersonalUseModal(false)}
          onSuccess={() => {
            setShowPersonalUseModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
