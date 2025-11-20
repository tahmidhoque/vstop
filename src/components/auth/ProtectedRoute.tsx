import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { PasswordType } from '@/generated/enums'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredType: PasswordType
  redirectTo: string
}

export default async function ProtectedRoute({
  children,
  requiredType,
  redirectTo,
}: ProtectedRouteProps) {
  const session = await getSession()

  if (session !== requiredType) {
    redirect(redirectTo)
  }

  return <>{children}</>
}
