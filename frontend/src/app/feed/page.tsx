'use client'

import { useState, useEffect, useMemo } from 'react'
import EchoCard from '@/components/EchoCard'
import Navbar from '@/components/Navbar'
import Toast from '@/components/Toast'
import { Echo } from '@/types/echo'
import { useEcho } from '@/contexts/EchoContext'
import { useAuth } from '@/contexts/AuthContext'
import { getNearbyEchoes, reEcho as reEchoDb } from '@/lib/echoes'

export default function FeedPage() {
  const { newEchos } = useEcho()
  const { user } = useAuth()
  const [echos, setEchos] = useState<Echo[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeConfirmationId, setActiveConfirmationId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Get user's location on mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Load echoes when location is available
  useEffect(() => {
    if (userLocation !== null) {
      loadEchoes()
    }
  }, [userLocation])

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
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
          console.error('Error getting location:', error)
          // Use default location (0, 0) if user denies
          setUserLocation({ lat: 0, lng: 0 })
          setToast({
            message: 'Location access denied. Showing all echoes.',
            type: 'error'
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000, // Cache for 1 minute
        }
      )
    } else {
      console.error('Geolocation not supported')
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

  // Combine new echos with existing echos
  const allEchos = useMemo(() => {
    const combined = [...newEchos, ...echos]
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Echo</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading echoes...</p>
          </div>
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Echo</h1>
          </div>
        </header>

        {/* Re-echo Limit Notice */}
        <div className="max-w-md mx-auto px-4 py-3 bg-white border-b border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            You only have 5 🔁 left this month!
          </p>
        </div>

        {/* Echo List */}
        <main className="max-w-md mx-auto bg-white">
          {allEchos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Echoes Yet</h2>
              <p className="text-gray-500 text-center">
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
