"use client";

import { useState } from "react";
import { ReturnStatus } from "@/generated/enums";
import type { FaultyReturnWithRelations } from "@/types";
import { formatDate } from "@/lib/date-utils";
import {
  updateFaultyReturnStatus,
  createReplacementOrder,
  deleteFaultyReturn,
} from "@/lib/actions";

interface ReturnDetailsModalProps {
  faultyReturn: FaultyReturnWithRelations;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ReturnDetailsModal({
  faultyReturn,
  onClose,
  onUpdate,
}: ReturnDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<ReturnStatus>(faultyReturn.status);
  const [statusNotes, setStatusNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [replacementUsername, setReplacementUsername] = useState("");

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

  const handleStatusUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateFaultyReturnStatus(
        faultyReturn.id,
        newStatus,
        statusNotes || undefined
      );
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      setLoading(false);
    }
  };

  const handleCreateReplacement = async () => {
    if (!replacementUsername.trim()) {
      setError("Please enter a customer name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createReplacementOrder(faultyReturn.id, replacementUsername);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create replacement order"
      );
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await deleteFaultyReturn(faultyReturn.id);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete return");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Return Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {faultyReturn.returnNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                faultyReturn.status
              )}`}
            >
              {faultyReturn.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Product</p>
                <p className="text-sm font-medium text-gray-900">
                  {faultyReturn.product.name}
                  {faultyReturn.variant && ` (${faultyReturn.variant.flavour})`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Quantity</p>
                <p className="text-sm font-medium text-gray-900">
                  {faultyReturn.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-700">
                  {formatDate(faultyReturn.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-gray-700">
                  {formatDate(faultyReturn.updatedAt)}
                </p>
              </div>
              {faultyReturn.orderNumber && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Linked Order</p>
                  <p className="text-sm font-medium text-blue-600">
                    {faultyReturn.orderNumber}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Faulty Reason</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {faultyReturn.faultyReason}
              </p>
            </div>

            {faultyReturn.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Additional Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {faultyReturn.notes}
                </p>
              </div>
            )}

            {faultyReturn.replacementOrderId && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Replacement Order</p>
                <p className="text-sm font-medium text-green-600">
                  {faultyReturn.replacementOrder?.orderNumber ||
                    faultyReturn.replacementOrderId}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!showStatusUpdate && !showReplacementForm && !showDeleteConfirm && (
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowStatusUpdate(true)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] transition-colors disabled:opacity-50"
              >
                Update Status
              </button>

              {!faultyReturn.replacementOrderId &&
                faultyReturn.status !== "DISPOSED" && (
                  <button
                    onClick={() => setShowReplacementForm(true)}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] transition-colors disabled:opacity-50"
                  >
                    Create Replacement Order
                  </button>
                )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] transition-colors disabled:opacity-50"
              >
                Delete Return
              </button>
            </div>
          )}

          {/* Status Update Form */}
          {showStatusUpdate && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReturnStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="REPORTED">Reported</option>
                  <option value="INSPECTED">Inspected</option>
                  <option value="REPLACED">Replaced</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={2}
                  placeholder="Add notes about this status change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          )}

          {/* Replacement Order Form */}
          {showReplacementForm && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={replacementUsername}
                  onChange={(e) => setReplacementUsername(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A new order will be created for {faultyReturn.quantity}x{" "}
                  {faultyReturn.product.name}
                  {faultyReturn.variant && ` (${faultyReturn.variant.flavour})`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowReplacementForm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReplacement}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this return? This action cannot be
                undone.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
