'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AudioVisualizer from '@/components/AudioVisualizer'
import Navbar from '@/components/Navbar'
import { Echo } from '@/types/echo'
import { getEchoById, recordListen, reEcho as reEchoDb } from '@/lib/echoes'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

// Helper function to format distance for display
function formatDistanceDisplay(feet: number): string {
  console.log('🔍 formatDistanceDisplay called with:', feet)
  if (feet === 0) return 'Unknown distance';

  // If distance is more than 1000 feet, show in miles
  if (feet >= 1000) {
    const miles = (feet / 5280).toFixed(1);
    return `${miles} mi away`;
  }

  // Otherwise show in feet
  return `${feet.toLocaleString()} ft away`;
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EchoDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement>(null)

  const [echo, setEcho] = useState<Echo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [hasRecordedListen, setHasRecordedListen] = useState(false)
  const [hasReEchoed, setHasReEchoed] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showReEchoConfirm, setShowReEchoConfirm] = useState(false)

  // Get user's location on mount
  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    console.log('🌍 Attempting to get user location...')
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          console.log('✅ User location obtained:', location)
        },
        (error) => {
          console.error('❌ Error getting location:', error)
          setUserLocation({ lat: 0, lng: 0 })
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        }
      )
    } else {
      console.log('⚠️ Geolocation not supported')
      setUserLocation({ lat: 0, lng: 0 })
    }
  }

  // Load echo data from database when location is available
  useEffect(() => {
    console.log('🔄 Location state changed:', userLocation)
    if (userLocation !== null) {
      console.log('📥 Loading echo with location...')
      loadEcho()
    }
  }, [resolvedParams.id, userLocation])

  const loadEcho = async () => {
    setLoading(true)
    console.log('🎯 loadEcho called, passing location:', userLocation)
    try {
      const fetchedEcho = await getEchoById(resolvedParams.id, userLocation || undefined)
      if (fetchedEcho) {
        console.log('📦 Fetched echo:', fetchedEcho)
        setEcho(fetchedEcho)
      }
    } catch (error) {
      console.error('Error loading echo:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reload audio when echo changes and set initial duration
  useEffect(() => {
    if (echo && audioRef.current) {
      audioRef.current.load()
      setCurrentTime(0)
      setIsPlaying(false)

      // Set duration from database if available
      if (echo.duration && echo.duration > 0) {
        console.log('📊 Setting duration from database:', echo.duration, 'seconds')
        setDuration(echo.duration)
      }
    }
  }, [echo?.audioUrl, echo?.duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      // Debug: Log every 2 seconds to avoid spam
      if (Math.floor(audio.currentTime) % 2 === 0) {
        console.log('⏱️ Current time:', audio.currentTime.toFixed(2), 'seconds')
      }
    }
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        console.log('🎵 Audio duration updated from metadata:', audio.duration, 'seconds')
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      // Clear interval when audio ends
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    const handleCanPlay = () => {
      // Also try to set duration when audio can play
      if (audio.duration && isFinite(audio.duration)) {
        console.log('▶️ Audio can play, duration:', audio.duration, 'seconds')
        setDuration(audio.duration)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('ended', handleEnded)

    // Try to set duration immediately if already loaded
    if (audio.duration && isFinite(audio.duration)) {
      console.log('✅ Audio already loaded, duration:', audio.duration, 'seconds')
      setDuration(audio.duration)
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('ended', handleEnded)

      // Clear interval on cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // Record listen when user plays 50% of the audio
  useEffect(() => {
    if (!echo || hasRecordedListen) return

    const listenThreshold = duration * 0.5

    if (currentTime >= listenThreshold && duration > 0) {
      recordListen(echo.id, user?.id || null, Math.floor(currentTime))
      setHasRecordedListen(true)
    }
  }, [currentTime, duration, echo, user, hasRecordedListen])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      console.log('⏸️ Audio paused')
      // Clear interval when pausing
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      audio.play().then(() => {
        console.log('▶️ Audio playing')
        // Start interval to update currentTime (fallback if timeupdate doesn't fire)
        intervalRef.current = setInterval(() => {
          if (audio.currentTime) {
            setCurrentTime(audio.currentTime)
          }
        }, 100) // Update every 100ms for smooth progress
      }).catch((error) => {
        console.error('❌ Error playing audio:', error)
      })
    }
    setIsPlaying(!isPlaying)
  }

  const handleVolumeUp = () => {
    const newVolume = Math.min(volume + 0.1, 1)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleVolumeDown = () => {
    const newVolume = Math.max(volume - 0.1, 0)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) {
      return '0:00'
    }
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    }
  }

  const handleReEchoClick = () => {
    if (!user) {
      setToast({ message: 'You must be logged in to re-echo', type: 'error' })
      return
    }

    if (hasReEchoed) {
      setToast({ message: 'You already re-echoed this', type: 'error' })
      return
    }

    setShowReEchoConfirm(true)
  }

  const confirmReEcho = async () => {
    const success = await reEchoDb(user!.id, echo!.id)

    if (success) {
      setHasReEchoed(true)
      setToast({ message: 'Echo re-echoed successfully!', type: 'success' })
      // Update the re-echo count locally
      if (echo) {
        setEcho({ ...echo, reEchoCount: echo.reEchoCount + 1 })
      }
    } else {
      setToast({ message: 'Failed to re-echo', type: 'error' })
    }
    setShowReEchoConfirm(false)
  }

  const cancelReEcho = () => {
    setShowReEchoConfirm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading echo...</p>
          </div>
        </div>
        <Navbar />
      </div>
    )
  }

  if (!echo) {
    return (
      <div className="min-h-screen bg-black pb-20">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">Echo Not Found</h2>
          <p className="text-gray-400 text-center mb-4">
            This echo might have been removed or doesn't exist.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="px-6 py-3 text-black rounded-full font-semibold transition-colors"
            style={{
              background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
            }}
          >
            Back to Feed
          </button>
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <main className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full mb-8 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300"
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
        </div>

        {/* Echo Title - Centered */}
        <h2 className="text-xl font-bold text-white mb-12 text-center">{echo.title}</h2>

        {/* Audio Visualizer - Circular in center */}
        <div className="mb-6">
          <AudioVisualizer isPlaying={isPlaying} />
        </div>

        {/* Username below visualizer */}
        <p className="text-sm text-gray-400 mb-8">@{echo.username || 'unknown'}</p>

        {/* Audio Progress Bar */}
        <div className="w-full max-w-xs mb-8">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            step="0.1"
            style={{
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / (duration || 1)) * 100}%, #4b5563 ${(currentTime / (duration || 1)) * 100}%, #4b5563 100%)`
            }}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play/Pause Button - Large and centered */}
        <button
          onClick={togglePlayPause}
          className="mb-12 p-6 rounded-full bg-white hover:bg-gray-200 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Action Buttons - Heart and Re-echo */}
        <div className="flex items-center gap-16 mb-8">
          {/* Like/Heart Button */}
          <button
            className="flex flex-col items-center gap-2"
            aria-label="Like"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Re-echo Button - Highlighted with yellow gradient or confirmation */}
          {!showReEchoConfirm ? (
            <button
              onClick={handleReEchoClick}
              disabled={hasReEchoed}
              className="flex flex-col items-center gap-2"
              aria-label="Re-echo"
            >
              <div
                className={`p-3 rounded-full ${hasReEchoed ? 'bg-gray-600' : ''}`}
                style={!hasReEchoed ? {
                  background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                } : {}}
              >
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {/* Confirm Button - Checkmark */}
              <button
                onClick={confirmReEcho}
                className="p-3 rounded-full"
                style={{
                  background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                }}
                aria-label="Confirm re-echo"
              >
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>

              {/* Cancel Button - Cross */}
              <button
                onClick={cancelReEcho}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                aria-label="Cancel re-echo"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={echo.audioUrl}
          preload="metadata"
          crossOrigin="anonymous"
        />
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
