import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ReportsPageClient from "./ReportsPageClient";
import { getReportsData } from "@/lib/actions";
import { OrderStatus } from "@/generated/enums";

export default async function ReportsPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  // Default to last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Default status filters: exclude PENDING and UNFULFILLED
  const defaultIncludeStatuses = [
    OrderStatus.FULFILLED,
    OrderStatus.CANCELLED,
  ];

  const reportsData = await getReportsData(
    startDate,
    endDate,
    defaultIncludeStatuses,
  );

  // Initial filter state for client component
  const initialStatusFilters = {
    PENDING: false,
    UNFULFILLED: false,
    FULFILLED: true,
    CANCELLED: true,
  };

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <ReportsPageClient
        initialData={reportsData}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialStatusFilters={initialStatusFilters}
      />
    </ProtectedRoute>
  );
}




