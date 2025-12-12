import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StockPageClient from "./StockPageClient";
import { getStockData } from "@/lib/actions";

export default async function StockPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  const products = await getStockData(true); // includeHidden: true

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <StockPageClient products={products} />
    </ProtectedRoute>
  );
}

