'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'
import { useEcho } from '@/contexts/EchoContext'
import { useAuth } from '@/contexts/AuthContext'
import { Echo } from '@/types/echo'
import { ArchivedEcho } from '@/types/archived-echo'
import { getArchivedEchoes, deleteArchivedEcho } from '@/lib/archived-echoes'

export default function ArchivedEchosPage() {
  const router = useRouter()
  const { addNewEcho } = useEcho()
  const { user } = useAuth()
  const [archivedEchos, setArchivedEchos] = useState<ArchivedEcho[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous'

  useEffect(() => {
    if (user) {
      loadArchivedEchoes()
    }
  }, [user])

  const loadArchivedEchoes = async () => {
    if (!user) return

    setLoading(true)
    try {
      const echoes = await getArchivedEchoes(user.id)
      setArchivedEchos(echoes)
    } catch (error) {
      console.error('Error loading archived echoes:', error)
      setToast({ message: 'Failed to load archived echoes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEcho = async (echoId: string) => {
    const success = await deleteArchivedEcho(echoId)
    if (success) {
      setArchivedEchos(archivedEchos.filter((echo) => echo.id !== echoId))
      setToast({ message: 'Echo deleted successfully', type: 'success' })
    } else {
      setToast({ message: 'Failed to delete echo', type: 'error' })
    }
  }

  const handleUploadEcho = (echoId: string) => {
    // Find the archived echo
    const archivedEcho = archivedEchos.find((echo) => echo.id === echoId)
    if (!archivedEcho) return

    // Create a new echo object to add to the feed
    const newEcho: Echo = {
      id: `uploaded-${Date.now()}`,
      title: archivedEcho.title || 'Untitled Echo',
      username: username,
      avatarColor: '#3B82F6',
      distance: 0,
      reEchoCount: 0,
      seenCount: 0,
      audioUrl: archivedEcho.audio_url,
      transcript: '',
      hasReEchoed: false,
      createdAt: new Date().toISOString(),
    }

    // Add to feed immediately
    addNewEcho(newEcho)

    // Save to localStorage for uploaded echos (temporary until backend is fully integrated)
    const uploaded = localStorage.getItem('uploadedEchos')
    const uploadedEchos = uploaded ? JSON.parse(uploaded) : []
    uploadedEchos.unshift(newEcho)
    localStorage.setItem('uploadedEchos', JSON.stringify(uploadedEchos))

    setToast({ message: 'Echo uploaded successfully!', type: 'success' })
    setTimeout(() => router.push('/feed'), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Archived Echos</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Archived Echos</h1>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto">
        {archivedEchos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Archived Echos</h2>
            <p className="text-gray-500 text-center">
              Echos you archive or record with your Omi device will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white">
            <div className="divide-y divide-gray-200">
              {archivedEchos.map((echo) => (
                <div key={echo.id} className="px-4 py-4">
                  {/* Title */}
                  <div className="flex items-center justify-between mb-2">
                    {echo.title && (
                      <h3 className="text-base font-semibold text-gray-900 flex-1">
                        {echo.title}
                      </h3>
                    )}
                    {echo.source === 'omi' && (
                      <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        Omi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {new Date(echo.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDeleteEcho(echo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Delete echo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <audio controls className="w-full mb-3">
                    <source src={echo.audio_url} type="audio/webm" />
                    <source src={echo.audio_url} type="audio/wav" />
                    <source src={echo.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>

                  {/* Upload Button */}
                  <button
                    onClick={() => handleUploadEcho(echo.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload Echo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

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
