"use client";

import React from "react";
import { formatDate } from "@/lib/date-utils";
import type { FaultyReturn } from "@/types";

interface FaultyReturnListProps {
  faultyReturns: FaultyReturn[];
  onViewDetails: (faultyReturn: FaultyReturn) => void;
  isPending: boolean;
}

export default function FaultyReturnList({
  faultyReturns,
  onViewDetails,
  isPending,
}: FaultyReturnListProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      REPORTED: "bg-yellow-100 text-yellow-800",
      INSPECTED: "bg-blue-100 text-blue-800",
      REPLACED: "bg-green-100 text-green-800",
      DISPOSED: "bg-gray-100 text-gray-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (orderId: string | null) => {
    return orderId
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800";
  };

  const getTypeLabel = (orderId: string | null) => {
    return orderId ? "Post-Sale" : "Pre-Sale";
  };

  const calculateLoss = (product: any, quantity: number) => {
    return product.price * quantity;
  };

  if (isPending) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (faultyReturns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No faulty returns found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {faultyReturns.map((fr) => (
          <div key={fr.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {fr.returnNumber}
                </p>
                <div className="flex gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadge(fr.orderId)}`}
                  >
                    {getTypeLabel(fr.orderId)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(fr.status)}`}
                  >
                    {fr.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Product:</span>{" "}
                <span className="font-medium text-gray-900">
                  {fr.product.name}
                  {fr.variant && ` (${fr.variant.flavour})`}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>{" "}
                <span className="font-medium text-gray-900">{fr.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Reason:</span>{" "}
                <span className="text-gray-900">{fr.faultyReason}</span>
              </div>
              <div>
                <span className="text-gray-600">Loss:</span>{" "}
                <span className="font-medium text-red-600">
                  £{calculateLoss(fr.product, fr.quantity).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>{" "}
                <span className="text-gray-900">{formatDate(fr.createdAt)}</span>
              </div>
              {fr.orderId && fr.order && (
                <div>
                  <span className="text-gray-600">Order:</span>{" "}
                  <span className="text-gray-900">{fr.order.orderNumber}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onViewDetails(fr)}
              className="mt-3 w-full px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 active:bg-blue-100 min-h-[44px] font-medium transition-colours"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Return #
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Loss
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faultyReturns.map((fr) => (
              <tr key={fr.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {fr.returnNumber}
                  </div>
                  {fr.orderId && fr.order && (
                    <div className="text-xs text-gray-500">
                      Order: {fr.order.orderNumber}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadge(fr.orderId)}`}
                  >
                    {getTypeLabel(fr.orderId)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{fr.product.name}</div>
                  {fr.variant && (
                    <div className="text-xs text-gray-500">
                      {fr.variant.flavour}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {fr.quantity}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {fr.faultyReason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(fr.status)}`}
                  >
                    {fr.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  £{calculateLoss(fr.product, fr.quantity).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(fr.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onViewDetails(fr)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
