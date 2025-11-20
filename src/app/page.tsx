import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginForm from '@/components/auth/LoginForm'
import { verifyCustomerPassword, createSession } from '@/lib/auth'

async function handleLogin(password: string) {
  'use server'
  
  const isValid = await verifyCustomerPassword(password)
  
  if (isValid) {
    await createSession('CUSTOMER')
    return { success: true }
  }
  
  return { success: false, error: 'Invalid password' }
}

export default async function HomePage() {
  const session = await getSession()
  
  if (session === 'CUSTOMER') {
    redirect('/store')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-600">Please enter your password to access the store</p>
        </div>
        <LoginForm type="customer" onSubmit={handleLogin} />
      </div>
    </div>
  )
}