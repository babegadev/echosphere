import { createClient } from './supabase'
import { ArchivedEcho } from '@/types/archived-echo'

export async function getArchivedEchoes(userId: string): Promise<ArchivedEcho[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('archived_echoes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching archived echoes:', error)
    return []
  }

  return data || []
}

export async function createArchivedEcho(
  userId: string,
  audioUrl: string,
  title?: string,
  duration?: number,
  source: 'omi' | 'manual' = 'manual'
): Promise<ArchivedEcho | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('archived_echoes')
    .insert({
      user_id: userId,
      audio_url: audioUrl,
      title,
      duration,
      source,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating archived echo:', error)
    return null
  }

  return data
}

export async function deleteArchivedEcho(echoId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('archived_echoes')
    .delete()
    .eq('id', echoId)

  if (error) {
    console.error('Error deleting archived echo:', error)
    return false
  }

  return true
}

export async function uploadAudioFile(
  file: File | Blob,
  userId: string,
  filename: string
): Promise<string | null> {
  const supabase = createClient()

  const filePath = `${userId}/${Date.now()}-${filename}`

  const { data, error } = await supabase.storage
    .from('archived-audio')
    .upload(filePath, file, {
      contentType: file.type || 'audio/webm',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading audio file:', error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('archived-audio')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
