"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { updateFaultyReturnStatus } from "@/lib/actions";
import type { FaultyReturn, ReturnStatus } from "@/types";
import CreateReplacementOrderModal from "./CreateReplacementOrderModal";

interface FaultyReturnModalProps {
  faultyReturn: FaultyReturn;
  onClose: () => void;
}

export default function FaultyReturnModal({
  faultyReturn,
  onClose,
}: FaultyReturnModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [error, setError] = useState("");

  const handleStatusUpdate = async (newStatus: ReturnStatus) => {
    setError("");
    setIsUpdating(true);

    try {
      await updateFaultyReturnStatus(faultyReturn.id, newStatus);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplacementCreated = () => {
    setShowReplacementModal(false);
    onClose();
  };

  const calculateLoss = () => {
    return faultyReturn.product.price * faultyReturn.quantity;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      REPORTED: "bg-yellow-100 text-yellow-800",
      INSPECTED: "bg-blue-100 text-blue-800",
      REPLACED: "bg-green-100 text-green-800",
      DISPOSED: "bg-gray-100 text-gray-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {faultyReturn.returnNumber}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      faultyReturn.orderId
                        ? "bg-purple-100 text-purple-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {faultyReturn.orderId ? "Post-Sale" : "Pre-Sale"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(faultyReturn.status)}`}
                  >
                    {faultyReturn.status}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Product Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Product Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-900">
                    {faultyReturn.product.name}
                  </span>
                </div>
                {faultyReturn.variant && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Variant:</span>
                    <span className="font-medium text-gray-900">
                      {faultyReturn.variant.flavour}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">
                    {faultyReturn.quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-medium text-gray-900">
                    £{faultyReturn.product.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-semibold">Total Loss:</span>
                  <span className="font-bold text-red-600">
                    £{calculateLoss().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Faulty Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Faulty Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Reason:</span>
                  <p className="text-gray-900 mt-1">{faultyReturn.faultyReason}</p>
                </div>
                {faultyReturn.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{faultyReturn.notes}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Reported:</span>
                  <span className="text-gray-900">
                    {formatDate(faultyReturn.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Information (Post-Sale) */}
            {faultyReturn.orderId && faultyReturn.order && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium text-gray-900">
                      {faultyReturn.order.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="text-gray-900">
                      {faultyReturn.order.username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <span className="text-gray-900">
                      {faultyReturn.order.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Replacement Order Information */}
            {faultyReturn.replacementOrderId && faultyReturn.replacementOrder && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Replacement Order
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium text-gray-900">
                      {faultyReturn.replacementOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="text-gray-900">
                      {faultyReturn.replacementOrder.username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-900">
                      {faultyReturn.replacementOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Update Actions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Update Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {faultyReturn.status === "REPORTED" && (
                  <button
                    onClick={() => handleStatusUpdate("INSPECTED")}
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 min-h-[44px] font-medium transition-colours"
                  >
                    Mark as Inspected
                  </button>
                )}
                {(faultyReturn.status === "REPORTED" ||
                  faultyReturn.status === "INSPECTED") && (
                  <button
                    onClick={() => handleStatusUpdate("DISPOSED")}
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 disabled:bg-gray-400 min-h-[44px] font-medium transition-colours"
                  >
                    Mark as Disposed
                  </button>
                )}
              </div>
            </div>

            {/* Create Replacement Order (Post-Sale Only) */}
            {faultyReturn.orderId &&
              !faultyReturn.replacementOrderId &&
              faultyReturn.status !== "DISPOSED" && (
                <div>
                  <button
                    onClick={() => setShowReplacementModal(true)}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 min-h-[44px] font-medium transition-colours"
                  >
                    Create Replacement Order
                  </button>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] font-medium transition-colours"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Replacement Order Modal */}
      {showReplacementModal && (
        <CreateReplacementOrderModal
          faultyReturn={faultyReturn}
          onClose={() => setShowReplacementModal(false)}
          onSuccess={handleReplacementCreated}
        />
      )}
    </>
  );
}
