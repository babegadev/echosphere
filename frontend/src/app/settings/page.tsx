'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Toast from '@/components/Toast'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadUserAvatar()
  }, [])

  const loadUserAvatar = async () => {
    if (!user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setAvatarUrl(data.avatar_url)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setToast({ message: 'Successfully signed out', type: 'success' })
      setTimeout(() => router.push('/auth'), 1000)
    } catch (error) {
      setToast({ message: 'Failed to sign out', type: 'error' })
    }
  }

  const SettingItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
    <button
      onClick={onClick}
      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-900 transition-colors border-b border-gray-800"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base text-white">{label}</span>
      </div>
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between relative">
          {/* Profile Picture - Left */}
          <Link href="/profile" className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            )}
          </Link>

          {/* Settings Title - Center */}
          <button
            className="px-6 py-3 rounded-full text-black font-semibold text-base font-[family-name:var(--font-roboto)] absolute left-1/2 -translate-x-1/2"
            style={{
              width: '179px',
              height: '50px',
              background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
            }}
          >
            Settings
          </button>

          {/* Empty spacer - Right */}
          <div className="w-10 flex-shrink-0"></div>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto">
        {/* Account Section */}
        <div className="px-4 py-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</h2>
        </div>
        <div className="bg-black">
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>}
            label="Account"
            onClick={() => setToast({ message: 'Account settings coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>}
            label="Privacy"
            onClick={() => setToast({ message: 'Privacy settings coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            label="Security & permissions"
            onClick={() => setToast({ message: 'Security settings coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>}
            label="Share profile"
            onClick={() => setToast({ message: 'Share profile coming soon', type: 'error' })}
          />
        </div>

        {/* Content & Display Section */}
        <div className="px-4 py-2 mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content & Display</h2>
        </div>
        <div className="bg-black">
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>}
            label="Notifications"
            onClick={() => setToast({ message: 'Notifications coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>}
            label="Activity center"
            onClick={() => setToast({ message: 'Activity center coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>}
            label="Language"
            onClick={() => setToast({ message: 'Language settings coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>}
            label="Display"
            onClick={() => setToast({ message: 'Display settings coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>}
            label="Accessibility"
            onClick={() => setToast({ message: 'Accessibility settings coming soon', type: 'error' })}
          />
        </div>

        {/* Cache & Cellular Section */}
        <div className="px-4 py-2 mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cache & Cellular</h2>
        </div>
        <div className="bg-black">
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>}
            label="Offline echoes"
            onClick={() => setToast({ message: 'Offline echoes coming soon', type: 'error' })}
          />
          <SettingItem
            icon={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>}
            label="Free up space"
            onClick={() => setToast({ message: 'Free up space coming soon', type: 'error' })}
          />
        </div>

        {/* Sign Out Button */}
        <div className="px-4 mt-8 mb-8">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full px-4 py-4 flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 transition-colors rounded-lg border border-gray-800"
          >
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-base font-semibold text-red-500">Sign Out</span>
          </button>
        </div>
      </main>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center px-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-2">Sign Out?</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar />
    </div>
  )
}
