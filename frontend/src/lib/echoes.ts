import { createClient } from './supabase'
import { Echo } from '@/types/echo'
import APP_CONFIG from '@/config/app.config'
import { convertWebMToMP3 } from './audio-converter'

// Helper function to format distance from meters
function formatDistance(meters: number | null | undefined): number {
  if (meters == null) return 0

  // Return meters as-is, rounded to nearest whole number
  return Math.round(meters)
}

interface DBEcho {
  id: string
  user_id: string
  audio_url: string
  duration: number
  caption: string | null
  location: any
  location_name: string | null
  created_at: string
  listen_count: number
  re_echo_count: number
  is_active: boolean
  distance_meters?: number // Distance in meters from user location
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

// Get a single echo by ID
export async function getEchoById(
  echoId: string,
  userLocation?: { lat: number; lng: number }
): Promise<Echo | null> {
  const supabase = createClient()

  console.log('🔍 getEchoById called with:', { echoId, userLocation })

  // If user location is provided, use RPC to get distance
  if (userLocation && userLocation.lat !== 0 && userLocation.lng !== 0) {
    console.log('📍 Fetching echo with distance calculation...')
    const { data, error } = await supabase.rpc('get_nearby_echoes', {
      radius_meters: 999999999, // Very large radius to ensure we get this specific echo
      user_lat: userLocation.lat,
      user_lng: userLocation.lng,
    })

    if (error) {
      console.error('Error fetching echo with distance:', error)
      return null
    }

    console.log('📊 RPC returned echoes:', data?.length, 'echoes')

    // Find the specific echo by ID
    const echoData = (data as any[])?.find((e: any) => e.id === echoId)
    if (!echoData) {
      console.error('Echo not found in RPC results')
      return null
    }

    console.log('✅ Found echo with distance_meters:', echoData.distance_meters)
    return mapDBEchoToEcho(echoData)
  }

  console.log('⚠️ No location provided, fetching without distance')

  // Fallback: Get echo without distance calculation
  const { data, error } = await supabase
    .from('echoes')
    .select(`
      *,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', echoId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching echo:', error)
    return null
  }

  return mapDBEchoToEcho(data as any)
}

// Get nearby echoes based on user location
export async function getNearbyEchoes(
  userLocation?: { lat: number; lng: number },
  radiusMeters: number = APP_CONFIG.NEARBY_ECHOES_RADIUS_METERS,
  limit: number = APP_CONFIG.MAX_ECHOES_PER_LOAD
): Promise<Echo[]> {
  const supabase = createClient()

  // Use user's location or default location
  const lat = userLocation?.lat ?? APP_CONFIG.DEFAULT_LOCATION.lat
  const lng = userLocation?.lng ?? APP_CONFIG.DEFAULT_LOCATION.lng

  console.log('📍 Fetching echoes near:', { lat, lng }, 'radius:', radiusMeters, 'meters')

  // Call the Supabase RPC function to get nearby echoes
  const { data, error } = await supabase.rpc('get_nearby_echoes', {
    radius_meters: radiusMeters,
    user_lat: lat,
    user_lng: lng,
  })

  if (error) {
    console.error('Error fetching nearby echoes:', error)
    return []
  }

  console.log('✅ Found', data?.length || 0, 'nearby echoes')

  return mapDBEchoesToEchoes(data as any[])
}

// Get echoes by a specific user
export async function getUserEchoes(userId: string): Promise<Echo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('echoes')
    .select(`
      *,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user echoes:', error)
    return []
  }

  return mapDBEchoesToEchoes(data as any[])
}

// Create a new echo
export async function createEcho(
  userId: string,
  audioUrl: string,
  duration: number,
  caption: string,
  location?: { lat: number; lng: number },
  locationName?: string
): Promise<Echo | null> {
  const supabase = createClient()

  // Format location as POINT(lng lat) - matches Python: POINT(longitude latitude)
  // Python: location_str = f"POINT({self.location[1]} {self.location[0]})"
  const locationStr = location
    ? `POINT(${location.lng} ${location.lat})`
    : 'POINT(0 0)'

  // Match Python upload format exactly:
  // echo_data = {
  //   "user_id": self.user_id,
  //   "audio_url": audio_url,
  //   "duration": duration,
  //   "location": location_str,
  //   "location_name": None,
  // }
  const echoData: any = {
    user_id: userId,
    audio_url: audioUrl,
    duration: duration,
    location: locationStr,
    location_name: null,
  }

  console.log('Creating echo with data:', echoData)

  const { data, error } = await supabase
    .from('echoes')
    .insert(echoData)
    .select(`
      *,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Error creating echo:', error)
    return null
  }

  console.log('✅ Echo created successfully:', data.id)

  // Trigger transcription asynchronously (don't wait for it)
  if (data?.id) {
    triggerTranscription(data.id, audioUrl).catch((err) =>
      console.error('Failed to trigger transcription:', err)
    )
  }

  return mapDBEchoToEcho(data as any)
}

// Trigger transcription for an echo (async, fire and forget)
async function triggerTranscription(echoId: string, audioUrl: string) {
  try {
    await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        echoId,
        audioUrl,
      }),
    })
  } catch (error) {
    console.error('Error triggering transcription:', error)
  }
}

// Re-echo an existing echo
export async function reEcho(
  userId: string,
  originalEchoId: string,
  location?: { lat: number; lng: number },
  locationName?: string
): Promise<boolean> {
  const supabase = createClient()

  const defaultLocation = location
    ? `POINT(${location.lng} ${location.lat})`
    : 'POINT(0 0)'

  // Insert into re_echoes table
  // Database trigger will automatically increment re_echo_count
  const { error: reEchoError } = await supabase.from('re_echoes').insert({
    original_echo_id: originalEchoId,
    user_id: userId,
    location: defaultLocation,
    location_name: locationName,
  })

  if (reEchoError) {
    console.error('Error creating re-echo:', reEchoError)
    return false
  }

  return true
}

// Check if user has re-echoed an echo
export async function checkUserHasReEchoed(
  userId: string,
  echoId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('re_echoes')
    .select('id')
    .eq('user_id', userId)
    .eq('original_echo_id', echoId)
    .limit(1)

  if (error) {
    console.error('Error checking re-echo status:', error)
    return false
  }

  return (data?.length || 0) > 0
}

// Record a listen/view
export async function recordListen(
  echoId: string,
  userId: string | null,
  duration?: number
): Promise<void> {
  const supabase = createClient()

  // Insert listen record
  // Database trigger will automatically increment listen_count
  const { error: listenError } = await supabase.from('listens').insert({
    echo_id: echoId,
    user_id: userId,
    listen_duration: duration,
  })

  if (listenError) {
    console.error('Error recording listen:', listenError)
  }
}

// Delete an echo (soft delete - sets is_active to false)
export async function deleteEcho(echoId: string, userId: string): Promise<boolean> {
  const supabase = createClient()

  console.log('Attempting to delete echo:', echoId, 'for user:', userId)

  // Soft delete - set is_active to false instead of actually deleting
  // Include user_id check to ensure RLS works properly
  const { data, error } = await supabase
    .from('echoes')
    .update({ is_active: false })
    .eq('id', echoId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Error deleting echo:', error)
    console.error('Error details:', JSON.stringify(error))
    return false
  }

  console.log('Echo deleted successfully:', data)
  return true
}

// Upload audio file to storage
export async function uploadEchoAudio(
  file: File | Blob,
  userId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    // Convert WebM to MP3
    console.log('🔄 Converting audio to MP3...')
    const mp3Blob = await convertWebMToMP3(file)
    console.log('✅ Audio converted to MP3')

    const fileName = `${Date.now()}.mp3`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('echo-audio')
      .upload(filePath, mp3Blob, {
        contentType: 'audio/mpeg',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading audio:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('echo-audio')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error processing audio:', error)
    return null
  }
}

// Helper function to map database echoes to Echo type
function mapDBEchoesToEchoes(dbEchoes: any[]): Echo[] {
  return dbEchoes.map(mapDBEchoToEcho)
}

function mapDBEchoToEcho(dbEcho: any): Echo {
  const profile = dbEcho.profiles

  // Generate a color based on username
  const colors = ['#C0C0C0', '#FFB6C1', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
  const colorIndex = profile?.username
    ? profile.username.charCodeAt(0) % colors.length
    : 0

  return {
    id: dbEcho.id,
    userId: dbEcho.user_id,
    title: dbEcho.caption || 'Untitled Echo',
    username: profile?.username || 'unknown',
    avatarColor: colors[colorIndex],
    avatarUrl: profile?.avatar_url || null,
    distance: formatDistance(dbEcho.distance),
    reEchoCount: dbEcho.re_echo_count || 0,
    seenCount: dbEcho.listen_count || 0,
    audioUrl: dbEcho.audio_url,
    transcript: dbEcho.transcript || '',
    hasReEchoed: false, // TODO: Check if current user has re-echoed
    createdAt: dbEcho.created_at,
    duration: dbEcho.duration || 0,
  }
}
