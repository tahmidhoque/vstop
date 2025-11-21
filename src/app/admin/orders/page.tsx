import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OrdersPageClient from "./OrdersPageClient";
import { getOrders } from "@/lib/actions";

export default async function OrdersPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  const orders = await getOrders();

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <OrdersPageClient orders={orders} />
    </ProtectedRoute>
  );
}

