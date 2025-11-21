import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StorePageClient from "./StorePageClient";

export default async function StorePage() {
  return (
    <ProtectedRoute requiredType="CUSTOMER" redirectTo="/">
      <StorePageClient />
    </ProtectedRoute>
  );
}
