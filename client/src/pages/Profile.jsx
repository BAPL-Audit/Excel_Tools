import { useState } from 'react'

const Profile = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <p className="text-gray-600 mb-8">
        Manage your account settings and preferences.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Profile Page Coming Soon</h2>
        <p className="text-green-700">
          This page will allow you to update your profile information and preferences.
        </p>
      </div>
    </div>
  )
}

export default Profile