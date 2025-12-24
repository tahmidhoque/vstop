"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";
import { getFaultyReturns } from "@/lib/actions";
import type { FaultyReturn, FaultyReturnType } from "@/types";
import FaultyReturnList from "@/components/admin/FaultyReturnList";
import FaultyReturnForm from "@/components/admin/FaultyReturnForm";
import FaultyReturnModal from "@/components/admin/FaultyReturnModal";

interface FaultyPageClientProps {
  initialFaultyReturns: FaultyReturn[];
}

export default function FaultyPageClient({
  initialFaultyReturns,
}: FaultyPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [faultyReturns, setFaultyReturns] = useState<FaultyReturn[]>(
    initialFaultyReturns,
  );
  const [activeTab, setActiveTab] = useState<FaultyReturnType | "ALL">("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FaultyReturn | null>(
    null,
  );

  const handleLogout = async () => {
    await logoutAction();
    router.push("/admin/login");
    router.refresh();
  };

  const handleFilterChange = (type: FaultyReturnType | "ALL") => {
    setActiveTab(type);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type });
      setFaultyReturns(returns);
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type: activeTab });
      setFaultyReturns(returns);
    });
  };

  const handleViewDetails = (faultyReturn: FaultyReturn) => {
    setSelectedReturn(faultyReturn);
  };

  const handleModalClose = () => {
    setSelectedReturn(null);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type: activeTab });
      setFaultyReturns(returns);
    });
  };

  const filteredReturns = faultyReturns;

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
              Faulty Returns & Stock
            </h1>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] transition-colours"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => handleFilterChange("ALL")}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colours min-h-[44px] whitespace-nowrap ${
                  activeTab === "ALL"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                All Returns
              </button>
              <button
                onClick={() => handleFilterChange("POST_SALE")}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colours min-h-[44px] whitespace-nowrap ${
                  activeTab === "POST_SALE"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                Post-Sale Returns
              </button>
              <button
                onClick={() => handleFilterChange("PRE_SALE")}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colours min-h-[44px] whitespace-nowrap ${
                  activeTab === "PRE_SALE"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                Pre-Sale Faulty Stock
              </button>
            </nav>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 min-h-[44px] font-medium transition-colours"
          >
            {showCreateForm ? "Cancel" : "Report Faulty Item"}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-4 sm:mb-6">
            <FaultyReturnForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* List */}
        <FaultyReturnList
          faultyReturns={filteredReturns}
          onViewDetails={handleViewDetails}
          isPending={isPending}
        />
      </div>

      {/* Details Modal */}
      {selectedReturn && (
        <FaultyReturnModal
          faultyReturn={selectedReturn}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
