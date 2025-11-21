import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OrderConfirmationClient from "./OrderConfirmationClient";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <ProtectedRoute requiredType="CUSTOMER" redirectTo="/">
      <OrderConfirmationClient orderId={orderId} />
    </ProtectedRoute>
  );
}
