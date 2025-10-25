export interface ArchivedEcho {
  id: string
  user_id: string
  audio_url: string
  title?: string
  duration?: number
  created_at: string
  source?: 'omi' | 'manual' // Track if it came from Omi device or manual recording
}
