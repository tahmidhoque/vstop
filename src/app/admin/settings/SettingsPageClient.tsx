'use client'

import Link from 'next/link'
import PasswordChangeForm from '@/components/admin/PasswordChangeForm'

export default function SettingsPageClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3 sm:mb-4 inline-block min-h-[44px] flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Change End User Password
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-6">
            Update the password that end users need to enter to access the store.
          </p>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  )
}


