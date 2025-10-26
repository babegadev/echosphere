'use client'

import { useState, useEffect, useMemo } from 'react'
import EchoCard from '@/components/EchoCard'
import Navbar from '@/components/Navbar'
import Toast from '@/components/Toast'
import { Echo } from '@/types/echo'
import { useEcho } from '@/contexts/EchoContext'
import { useAuth } from '@/contexts/AuthContext'
import { getNearbyEchoes, reEcho as reEchoDb } from '@/lib/echoes'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function FeedPage() {
  const { newEchos } = useEcho()
  const { user } = useAuth()
  const [echos, setEchos] = useState<Echo[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeConfirmationId, setActiveConfirmationId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Get user's location and avatar on mount
  useEffect(() => {
    getUserLocation()
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

  // Load echoes when location is available
  useEffect(() => {
    if (userLocation !== null) {
      loadEchoes()
    }
  }, [userLocation])

  const getUserLocation = () => {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'

    if (!isSecureContext) {
      console.warn('Geolocation requires HTTPS')
      setUserLocation({ lat: 0, lng: 0 })
      return
    }

    if ('geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setUserLocation(location)
            console.log('📍 User location for feed:', location)
          },
          (error) => {
            console.warn('Geolocation error:', error.message)
            let errorMessage = 'Could not get location. '

            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please enable location permissions in your browser.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information unavailable.'
                break
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.'
                break
              default:
                errorMessage += 'Unknown error occurred.'
            }

            // Use default location (0, 0) if error occurs
            setUserLocation({ lat: 0, lng: 0 })
            // Don't show toast, just silently fall back
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          }
        )
      } catch (err) {
        console.warn('Geolocation exception:', err)
        setUserLocation({ lat: 0, lng: 0 })
      }
    } else {
      console.warn('Geolocation not supported')
      setUserLocation({ lat: 0, lng: 0 })
    }
  }

  const loadEchoes = async () => {
    setLoading(true)
    try {
      // Pass user location to get nearby echoes
      const fetchedEchoes = await getNearbyEchoes(userLocation || undefined)
      console.log('🔍 DEBUG: Fetched echoes from database:', fetchedEchoes)
      console.log('🔍 DEBUG: Number of echoes:', fetchedEchoes.length)
      console.log('🔍 DEBUG: First echo:', fetchedEchoes[0])
      setEchos(fetchedEchoes)
    } catch (error) {
      console.error('Error loading echoes:', error)
      setToast({ message: 'Failed to load echoes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Combine new echos with existing echos, removing duplicates
  const allEchos = useMemo(() => {
    // Create a Map to store unique echoes by ID
    const uniqueEchosMap = new Map()

    // Add new echoes first (they take priority)
    newEchos.forEach(echo => {
      uniqueEchosMap.set(echo.id, echo)
    })

    // Add fetched echoes (won't override if already exists)
    echos.forEach(echo => {
      if (!uniqueEchosMap.has(echo.id)) {
        uniqueEchosMap.set(echo.id, echo)
      }
    })

    const combined = Array.from(uniqueEchosMap.values())
    console.log('🔍 DEBUG: All echoes to render:', combined)
    console.log('🔍 DEBUG: Total echoes count:', combined.length)
    console.log('🔍 DEBUG: Echo IDs:', combined.map(e => e.id))
    return combined
  }, [newEchos, echos])

  const handleReEchoClick = (echoId: string) => {
    setActiveConfirmationId(echoId)
  }

  const handleReEcho = async (echoId: string, confirm: boolean) => {
    if (confirm) {
      if (!user) {
        setToast({ message: 'You must be logged in to re-echo', type: 'error' })
        setActiveConfirmationId(null)
        return
      }

      // Call the database function to re-echo
      const success = await reEchoDb(user.id, echoId)

      if (success) {
        // Update the local state to reflect the re-echo
        setEchos((prevEchos) =>
          prevEchos.map((echo) =>
            echo.id === echoId
              ? { ...echo, hasReEchoed: true, reEchoCount: echo.reEchoCount + 1 }
              : echo
          )
        )
        setToast({ message: 'Echo re-echoed successfully!', type: 'success' })
      } else {
        setToast({ message: 'Failed to re-echo', type: 'error' })
      }
    } else {
      setToast({ message: 'Re-echo cancelled', type: 'error' })
    }
    setActiveConfirmationId(null)
  }

  const handleRefreshFeed = () => {
    getUserLocation()
    loadEchoes()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            {/* Profile Picture */}
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

            {/* Near You Button */}
            <button
              onClick={handleRefreshFeed}
              className="px-6 py-3 rounded-full text-black font-semibold text-base font-[family-name:var(--font-roboto)]"
              style={{
                width: '179px',
                height: '50px',
                background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
              }}
            >
              Near You
            </button>

            {/* Empty spacer to maintain layout balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </header>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading echoes...</p>
          </div>
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-black pb-20">
        {/* Header */}
        <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            {/* Profile Picture */}
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

            {/* Near You Button */}
            <button
              onClick={handleRefreshFeed}
              className="px-6 py-3 rounded-full text-black font-semibold text-base font-[family-name:var(--font-roboto)]"
              style={{
                width: '179px',
                height: '50px',
                background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
              }}
            >
              Near You
            </button>

            {/* Empty spacer to maintain layout balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </header>

        {/* Re-echo Limit Notice */}
        <div className="max-w-md mx-auto px-4 py-3 bg-black border-b border-gray-800">
          <p className="text-sm text-white text-center flex items-center justify-center gap-1">
            You only have 5
            <span className="inline-block" style={{ width: '20.859px', height: '16px' }}>
              🔁
            </span>
            left this month!
          </p>
        </div>

        {/* Echo List */}
        <main className="max-w-md mx-auto bg-black">
          {allEchos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg
                className="w-16 h-16 text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-white mb-2">No Echoes Yet</h2>
              <p className="text-gray-400 text-center">
                Be the first to create an echo in your area!
              </p>
            </div>
          ) : (
            allEchos.map((echo) => (
              <EchoCard
                key={echo.id}
                echo={echo}
                onReEcho={handleReEcho}
                onReEchoClick={handleReEchoClick}
                disabled={false}
                isConfirmationActive={false}
                hasActiveConfirmation={false}
                isNewlyUploaded={false}
              />
            ))
          )}
        </main>

        {/* Navbar */}
        <Navbar />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  )
}
