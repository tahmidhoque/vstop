import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const session = await getSession();

  if (session !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <ProtectedRoute requiredType="ADMIN" redirectTo="/admin/login">
      <SettingsPageClient />
    </ProtectedRoute>
  );
}



