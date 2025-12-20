import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ReturnsPageClient from "./ReturnsPageClient";
import { getFaultyReturns } from "@/lib/actions";

export default async function ReturnsPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  const returns = await getFaultyReturns();

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <ReturnsPageClient returns={returns} />
    </ProtectedRoute>
  );
}
