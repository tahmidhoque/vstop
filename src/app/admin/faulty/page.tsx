import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FaultyPageClient from "./FaultyPageClient";
import { getFaultyReturns } from "@/lib/actions";

export default async function FaultyPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  const faultyReturns = await getFaultyReturns({ type: "ALL" });

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <FaultyPageClient initialFaultyReturns={faultyReturns} />
    </ProtectedRoute>
  );
}

