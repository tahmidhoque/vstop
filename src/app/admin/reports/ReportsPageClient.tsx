"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";
import { getReportsData } from "@/lib/actions";
import { formatDate } from "@/lib/date-utils";
import type { OrderWithItems, ReportsData, ProductBreakdown } from "@/types";
import { OrderStatus } from "@/generated/enums";

interface StatusFilters {
  PENDING: boolean;
  UNFULFILLED: boolean;
  FULFILLED: boolean;
  CANCELLED: boolean;
}

interface ReportsPageClientProps {
  initialData: ReportsData;
  initialStartDate: Date;
  initialEndDate: Date;
  initialStatusFilters: StatusFilters;
}

export default function ReportsPageClient({
  initialData,
  initialStartDate,
  initialEndDate,
  initialStatusFilters,
}: ReportsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reportsData, setReportsData] = useState<ReportsData>(initialData);
  const [startDate, setStartDate] = useState<string>(
    initialStartDate.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate.toISOString().split("T")[0],
  );
  const [statusFilters, setStatusFilters] =
    useState<StatusFilters>(initialStatusFilters);
  const [sortBy, setSortBy] = useState<
    "product" | "quantity" | "revenue" | "orders"
  >("revenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleLogout = async () => {
    await logoutAction();
    router.push("/admin/login");
    router.refresh();
  };

  const handleDateRangeChange = () => {
    startTransition(async () => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        alert("Start date must be before or equal to end date");
        return;
      }

      // Build array of statuses to include based on filter checkboxes
      const includeStatuses: OrderStatus[] = [];
      if (statusFilters.PENDING) includeStatuses.push(OrderStatus.PENDING);
      if (statusFilters.UNFULFILLED)
        includeStatuses.push(OrderStatus.UNFULFILLED);
      if (statusFilters.FULFILLED) includeStatuses.push(OrderStatus.FULFILLED);
      if (statusFilters.CANCELLED)
        includeStatuses.push(OrderStatus.CANCELLED);

      const data = await getReportsData(start, end, includeStatuses);
      setReportsData(data);
    });
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const totalValue = (order: OrderWithItems) => {
    return order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0,
    );
  };

  const sortedProductBreakdown = useMemo(() => {
    const breakdown = [...(reportsData.productBreakdown || [])];
    breakdown.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "product":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case "revenue":
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case "orders":
          comparison = a.orderCount - b.orderCount;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return breakdown;
  }, [reportsData.productBreakdown, sortBy, sortDirection]);

  const handleSort = (column: "product" | "quantity" | "revenue" | "orders") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Reports
            </h1>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 min-h-[44px] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Date Range
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex-1">
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                disabled={isPending}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDateRangeChange}
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Loading..." : "Update Report"}
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Order Status Filters
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Select which order statuses to include in the report. Filters apply
            to all statistics, sales calculations, and the transactions list.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center">
              <input
                id="filter-pending"
                type="checkbox"
                checked={statusFilters.PENDING}
                onChange={(e) =>
                  setStatusFilters({
                    ...statusFilters,
                    PENDING: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isPending}
              />
              <label
                htmlFor="filter-pending"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Pending
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="filter-unfulfilled"
                type="checkbox"
                checked={statusFilters.UNFULFILLED}
                onChange={(e) =>
                  setStatusFilters({
                    ...statusFilters,
                    UNFULFILLED: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isPending}
              />
              <label
                htmlFor="filter-unfulfilled"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Unfulfilled
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="filter-fulfilled"
                type="checkbox"
                checked={statusFilters.FULFILLED}
                onChange={(e) =>
                  setStatusFilters({
                    ...statusFilters,
                    FULFILLED: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isPending}
              />
              <label
                htmlFor="filter-fulfilled"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Fulfilled
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="filter-cancelled"
                type="checkbox"
                checked={statusFilters.CANCELLED}
                onChange={(e) =>
                  setStatusFilters({
                    ...statusFilters,
                    CANCELLED: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isPending}
              />
              <label
                htmlFor="filter-cancelled"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Cancelled
              </label>
            </div>
          </div>
          {/* Helper Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 How to Use Status Filters
            </h3>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Check the boxes</strong> for statuses you want to
                  include in the report
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Click "Update Report"</strong> after changing filters
                  to refresh the data
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Example:</strong> To see only completed orders, check
                  "Fulfilled" and uncheck all others
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Note:</strong> Cancelled orders are always excluded
                  from sales calculations, even if checked
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Orders
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {reportsData.totalOrders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Cancelled Orders
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {reportsData.cancelledOrders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Fulfilled Orders
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {reportsData.fulfilledOrders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Unfulfilled Orders
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              {reportsData.unfulfilledOrders}
            </p>
          </div>
        </div>

        {/* Total Sales Card - Prominently Displayed */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 sm:p-8 mb-4 sm:mb-8">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Sales
            </h3>
            <p className="text-3xl sm:text-5xl font-bold text-blue-600">
              {formatCurrency(reportsData.totalSales)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Based on selected filters (excluding cancelled orders and faulty returns from sales)
            </p>
          </div>
        </div>

        {/* Faulty Losses & Replacement Orders */}
        {reportsData.faultyLosses && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-8">
            {/* Faulty Losses Card */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Faulty Stock Losses
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Loss</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportsData.faultyLosses.totalLoss)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Pre-Sale Faulty</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(reportsData.faultyLosses.preSaleLoss)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reportsData.faultyLosses.preSaleCount} item(s)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Post-Sale Returns</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(reportsData.faultyLosses.postSaleLoss)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reportsData.faultyLosses.postSaleCount} item(s)
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Total faulty items: {reportsData.faultyLosses.count}
                  </p>
                </div>
              </div>
            </div>

            {/* Replacement Orders Card */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Replacement Orders
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Replacements</span>
                  <span className="text-2xl font-bold text-green-600">
                    {reportsData.replacementOrders?.length || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    Replacement orders are free replacements for faulty items and
                    do not count towards revenue.
                  </p>
                  {reportsData.replacementOrders && reportsData.replacementOrders.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-medium text-gray-900">Recent Replacements:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportsData.replacementOrders.slice(0, 5).map((order) => (
                          <div key={order.id} className="text-xs text-gray-600 flex justify-between">
                            <span>{order.orderNumber}</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Product Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Sales breakdown by product for the selected period
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {!reportsData.productBreakdown ||
            reportsData.productBreakdown.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No product sales found in the selected date range
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("product")}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          Product
                          {sortBy === "product" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("quantity")}
                          className="flex items-center justify-end gap-1 hover:text-gray-900 transition-colors ml-auto"
                        >
                          Quantity Sold
                          {sortBy === "quantity" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("revenue")}
                          className="flex items-center justify-end gap-1 hover:text-gray-900 transition-colors ml-auto"
                        >
                          Total Revenue
                          {sortBy === "revenue" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("orders")}
                          className="flex items-center justify-end gap-1 hover:text-gray-900 transition-colors ml-auto"
                        >
                          Orders
                          {sortBy === "orders" && (
                            <span className="text-blue-600">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProductBreakdown.map((product, productIndex) => (
                      <React.Fragment key={product.productId}>
                        {/* Product Total Row */}
                        <tr className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
                          <td className="py-3 px-4">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900">
                              {product.productName}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                            {product.totalQuantity}
                          </td>
                          <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                            {formatCurrency(product.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-600">
                            {product.orderCount}
                          </td>
                        </tr>
                        {/* Variant Rows - Commented out as variants not in ProductBreakdown type */}
                        {/* {product.variants && product.variants.map((variant, variantIndex) => (
                          <tr
                            key={`${product.productId}-${variant.variantId || "base"}`}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colours ${
                              productIndex === sortedProductBreakdown.length - 1 &&
                              variantIndex === product.variants.length - 1
                                ? "border-b-0"
                                : ""
                            }`}
                          >
                            <td className="py-2 px-4 pl-8 sm:pl-12">
                              <div className="text-xs sm:text-sm text-gray-600">
                                {variant.variantFlavour ? (
                                  <span className="text-gray-500">
                                    {variant.variantFlavour}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Base product
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-4 text-right text-xs sm:text-sm text-gray-600">
                              {variant.totalQuantity}
                            </td>
                            <td className="py-2 px-4 text-right text-xs sm:text-sm text-gray-600">
                              {formatCurrency(variant.totalRevenue)}
                            </td>
                            <td className="py-2 px-4 text-right text-xs sm:text-sm text-gray-500">
                              {variant.orderCount}
                            </td>
                          </tr>
                        ))} */}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="py-3 px-4 text-xs sm:text-sm font-semibold text-gray-900">
                        Total
                      </td>
                      <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                        {sortedProductBreakdown.reduce(
                          (sum, p) => sum + p.totalQuantity,
                          0,
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          sortedProductBreakdown.reduce(
                            (sum, p) => sum + p.totalRevenue,
                            0,
                          ),
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs sm:text-sm font-semibold text-gray-600">
                        {reportsData.orders
                          .filter((order) => order.status !== "CANCELLED")
                          .length}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Transactions
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {reportsData.orders.length} transaction
              {reportsData.orders.length !== 1 ? "s" : ""} in selected date
              range
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {reportsData.orders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No transactions found in the selected date range
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {reportsData.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {order.username}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span
                          className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "UNFULFILLED"
                                ? "bg-orange-100 text-orange-800"
                                : order.status === "FULFILLED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          {formatCurrency(totalValue(order))}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Items:
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs sm:text-sm text-gray-600 gap-2"
                          >
                            <span className="flex-1 min-w-0 truncate">
                              {item.product.name}
                              {item.flavour && ` (${item.flavour})`} ×{" "}
                              {item.quantity}
                            </span>
                            <span className="flex-shrink-0">
                              {formatCurrency(Number(item.priceAtTime))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-4 sm:mt-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px] flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
