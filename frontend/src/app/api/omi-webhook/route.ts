import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header or API key from Omi
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')

    // TODO: Validate the API key from Omi
    // For now, we'll accept requests with a valid auth header

    const body = await request.json()

    // Extract data from Omi webhook payload
    // Adjust these fields based on Omi's actual webhook structure
    const {
      user_id,
      audio_url,
      transcript,
      duration,
      recorded_at,
      segments,
    } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // If audio_url is provided directly by Omi
    if (audio_url) {
      // Create archived echo in database
      const { data, error } = await supabase
        .from('archived_echoes')
        .insert({
          user_id,
          audio_url,
          title: transcript
            ? transcript.substring(0, 100) // Use first 100 chars of transcript as title
            : 'Omi Recording',
          duration,
          source: 'omi',
          created_at: recorded_at || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving archived echo:', error)
        return NextResponse.json(
          { error: 'Failed to save archived echo' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        echo: data,
      })
    }

    // If audio is sent as base64 or file
    if (body.audio_base64) {
      // Decode base64 audio
      const audioBuffer = Buffer.from(body.audio_base64, 'base64')
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })

      // Upload to Supabase storage
      const fileName = `omi-${Date.now()}.wav`
      const filePath = `${user_id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('archived-audio')
        .upload(filePath, audioBlob, {
          contentType: 'audio/wav',
          upsert: false,
        })

      if (uploadError) {
        console.error('Error uploading audio:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload audio' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('archived-audio')
        .getPublicUrl(uploadData.path)

      // Create archived echo in database
      const { data: echoData, error: echoError } = await supabase
        .from('archived_echoes')
        .insert({
          user_id,
          audio_url: urlData.publicUrl,
          title: transcript
            ? transcript.substring(0, 100)
            : 'Omi Recording',
          duration,
          source: 'omi',
          created_at: recorded_at || new Date().toISOString(),
        })
        .select()
        .single()

      if (echoError) {
        console.error('Error saving archived echo:', echoError)
        return NextResponse.json(
          { error: 'Failed to save archived echo' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        echo: echoData,
      })
    }

    return NextResponse.json(
      { error: 'No audio data provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing Omi webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Omi webhook endpoint is ready',
  })
}
