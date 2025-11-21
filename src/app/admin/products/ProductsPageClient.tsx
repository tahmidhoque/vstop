"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions";

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  variants?: Array<{ id: string; flavour: string; stock: number }>;
}

interface ProductsPageClientProps {
  initialProducts: Product[];
}

export default function ProductsPageClient({
  initialProducts,
}: ProductsPageClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Sync products when initialProducts changes (after router.refresh())
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleCreate = async (data: {
    name: string;
    price: number;
    stock: number;
    variants: Array<{ flavour: string; stock: number }>;
  }) => {
    await createProduct(data);
    router.refresh();
    setShowForm(false);
  };

  const handleUpdate = async (data: {
    name: string;
    price: number;
    stock: number;
    variants: Array<{ id?: string; flavour: string; stock: number }>;
  }) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, data);
    router.refresh();
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      router.refresh();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px] flex items-center"
              >
                ← Back
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Products
              </h1>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
              >
                Add Product
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {showForm ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <ProductForm
              product={
                editingProduct
                  ? {
                      ...editingProduct,
                      price: Number(editingProduct.price),
                    }
                  : undefined
              }
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        ) : null}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-600">
              <p>No products yet. Add your first product to get started.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {products.map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          £{Number(product.price).toFixed(2)}
                        </p>
                        {product.variants && product.variants.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 mb-1">
                              Variants:
                            </div>
                            <div className="space-y-1">
                              {product.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className={`text-xs ${
                                    variant.stock <= 5
                                      ? "text-orange-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {variant.flavour}:{" "}
                                  {variant.stock > 5
                                    ? "In Stock"
                                    : `${variant.stock} available`}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              product.stock <= 5
                                ? "text-orange-600"
                                : "text-gray-600"
                            }`}
                          >
                            {product.stock > 5
                              ? "In Stock"
                              : `${product.stock} available`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 min-h-[44px] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 min-h-[44px] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            £{Number(product.price).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.variants && product.variants.length > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 mb-1">
                                Variants:
                              </div>
                              <div className="space-y-1">
                                {product.variants.map((variant) => (
                                  <div
                                    key={variant.id}
                                    className={`text-xs ${
                                      variant.stock <= 5
                                        ? "text-orange-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {variant.flavour}:{" "}
                                    {variant.stock > 5
                                      ? "In Stock"
                                      : `${variant.stock} available`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`text-sm font-medium ${
                                product.stock <= 5
                                  ? "text-orange-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {product.stock > 5
                                ? "In Stock"
                                : `${product.stock} available`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 min-h-[44px] px-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 min-h-[44px] px-3"
                            >
                              Delete
                            </button>
                          </div>
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
