"use client";

import { useState } from "react";
import Link from "next/link";
import { ReturnStatus } from "@/generated/enums";
import type { FaultyReturnWithRelations } from "@/types";
import { formatDate } from "@/lib/date-utils";
import FaultyReturnForm from "@/components/admin/FaultyReturnForm";
import ReturnDetailsModal from "@/components/admin/ReturnDetailsModal";

interface ReturnsPageClientProps {
  returns: FaultyReturnWithRelations[];
}

export default function ReturnsPageClient({ returns }: ReturnsPageClientProps) {
  const [filter, setFilter] = useState<ReturnStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FaultyReturnWithRelations | null>(null);

  // Filter returns by status
  const filteredByStatus =
    filter === "ALL"
      ? returns
      : returns.filter((ret) => ret.status === filter);

  // Filter by search query
  const filteredReturns = filteredByStatus.filter((ret) => {
    const query = searchQuery.toLowerCase();
    return (
      ret.returnNumber.toLowerCase().includes(query) ||
      ret.orderNumber?.toLowerCase().includes(query) ||
      ret.product.name.toLowerCase().includes(query) ||
      ret.faultyReason.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case "REPORTED":
        return "bg-blue-100 text-blue-800";
      case "INSPECTED":
        return "bg-purple-100 text-purple-800";
      case "REPLACED":
        return "bg-green-100 text-green-800";
      case "DISPOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Faulty Returns
            </h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
            >
              Log New Return
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search by return number, order number, product, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          />

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
                filter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              All ({returns.length})
            </button>
            <button
              onClick={() => setFilter("REPORTED")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
                filter === "REPORTED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Reported ({returns.filter((r) => r.status === "REPORTED").length})
            </button>
            <button
              onClick={() => setFilter("INSPECTED")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
                filter === "INSPECTED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Inspected ({returns.filter((r) => r.status === "INSPECTED").length})
            </button>
            <button
              onClick={() => setFilter("REPLACED")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
                filter === "REPLACED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Replaced ({returns.filter((r) => r.status === "REPLACED").length})
            </button>
            <button
              onClick={() => setFilter("DISPOSED")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] flex-shrink-0 active:scale-95 transition-transform ${
                filter === "DISPOSED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Disposed ({returns.filter((r) => r.status === "DISPOSED").length})
            </button>
          </div>
        </div>

        {/* Returns List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200">
              <p>No faulty returns found</p>
            </div>
          ) : (
            filteredReturns.map((ret) => (
              <div
                key={ret.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {ret.returnNumber}
                      </h3>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          ret.status
                        )}`}
                      >
                        {ret.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(ret.createdAt)}
                      {ret.orderNumber && ` • Order: ${ret.orderNumber}`}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Product</p>
                      <p className="text-sm font-medium text-gray-900">
                        {ret.product.name}
                        {ret.variant && ` (${ret.variant.flavour})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {ret.quantity}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Faulty Reason</p>
                      <p className="text-sm text-gray-700">{ret.faultyReason}</p>
                    </div>
                    {ret.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{ret.notes}</p>
                      </div>
                    )}
                    {ret.replacementOrderId && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Replacement Order
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          {ret.replacementOrder?.orderNumber || ret.replacementOrderId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedReturn(ret)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <FaultyReturnForm
          onClose={() => setShowCreateForm(false)}
          onSave={() => {
            setShowCreateForm(false);
            window.location.reload();
          }}
        />
      )}

      {/* Details Modal */}
      {selectedReturn && (
        <ReturnDetailsModal
          faultyReturn={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onUpdate={() => {
            setSelectedReturn(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
