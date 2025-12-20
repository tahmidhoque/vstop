import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminDashboardClient from "./AdminDashboardClient";
import { getOrders, getProducts, getFaultyReturns } from "@/lib/actions";

export default async function AdminDashboard() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  const [orders, products, faultyReturns] = await Promise.all([
    getOrders(),
    getProducts(true), // includeHidden: true for admin dashboard
    getFaultyReturns(),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const unfulfilledOrders = orders.filter(
    (o) => o.status === "UNFULFILLED",
  ).length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;
  const recentOrders = orders.slice(0, 5);
  
  const reportedReturns = faultyReturns.filter((r) => r.status === "REPORTED").length;
  const inspectedReturns = faultyReturns.filter((r) => r.status === "INSPECTED").length;

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <AdminDashboardClient
        pendingOrders={pendingOrders}
        unfulfilledOrders={unfulfilledOrders}
        lowStockProducts={lowStockProducts}
        recentOrders={recentOrders}
        reportedReturns={reportedReturns}
        inspectedReturns={inspectedReturns}
      />
    </ProtectedRoute>
  );
}
