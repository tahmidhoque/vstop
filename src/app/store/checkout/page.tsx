import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CheckoutPageClient from "./CheckoutPageClient";

export default async function CheckoutPage() {
  return (
    <ProtectedRoute requiredType="CUSTOMER" redirectTo="/">
      <CheckoutPageClient />
    </ProtectedRoute>
  );
}
