import { useState } from 'react'

const Admin = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <p className="text-gray-600 mb-8">
        Manage tools, users, and system settings.
      </p>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-purple-800 mb-2">Admin Panel Coming Soon</h2>
        <p className="text-purple-700">
          This admin panel will provide comprehensive tools management, user administration,
          and system analytics.
        </p>
      </div>
    </div>
  )
}

export default Admin