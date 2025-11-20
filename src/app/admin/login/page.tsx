import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginForm from '@/components/auth/LoginForm'
import { verifyAdminPassword, createSession } from '@/lib/auth'

async function handleLogin(password: string) {
  'use server'
  
  const isValid = await verifyAdminPassword(password)
  
  if (isValid) {
    await createSession('ADMIN')
    return { success: true }
  }
  
  return { success: false, error: 'Invalid password' }
}

export default async function AdminLoginPage() {
  const session = await getSession()
  
  if (session === 'ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter your admin password</p>
        </div>
        <LoginForm type="admin" onSubmit={handleLogin} />
      </div>
    </div>
  )
}
