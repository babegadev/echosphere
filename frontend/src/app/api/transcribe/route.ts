import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// This endpoint will be called to transcribe audio files
// You can use AssemblyAI, OpenAI Whisper, or any other transcription service

export async function POST(request: NextRequest) {
  try {
    const { echoId, audioUrl } = await request.json()

    if (!echoId || !audioUrl) {
      return NextResponse.json(
        { error: 'Echo ID and audio URL are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update status to processing
    await supabase
      .from('echoes')
      .update({ transcript_status: 'processing' })
      .eq('id', echoId)

    // Transcribe using AssemblyAI (you need to set up an account and get an API key)
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY

    if (!assemblyApiKey) {
      console.error('AssemblyAI API key not configured')

      // Update status to failed
      await supabase
        .from('echoes')
        .update({
          transcript_status: 'failed',
          transcript: 'Transcription service not configured'
        })
        .eq('id', echoId)

      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      )
    }

    // Step 1: Upload audio to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        authorization: assemblyApiKey,
      },
      body: await (await fetch(audioUrl)).arrayBuffer(),
    })

    const uploadData = await uploadResponse.json()

    if (!uploadData.upload_url) {
      throw new Error('Failed to upload audio to AssemblyAI')
    }

    // Step 2: Request transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: assemblyApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        language_code: 'en', // Change if you need other languages
      }),
    })

    const transcriptData = await transcriptResponse.json()
    const transcriptId = transcriptData.id

    // Step 3: Poll for completion (AssemblyAI is async)
    let transcript = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 second intervals)

    while (attempts < maxAttempts) {
      const pollingResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: assemblyApiKey,
          },
        }
      )

      const pollingData = await pollingResponse.json()

      if (pollingData.status === 'completed') {
        transcript = pollingData.text
        break
      } else if (pollingData.status === 'error') {
        throw new Error('Transcription failed')
      }

      // Wait 5 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    }

    if (!transcript) {
      throw new Error('Transcription timeout')
    }

    // Step 4: Update echo with transcript
    const { error: updateError } = await supabase
      .from('echoes')
      .update({
        transcript,
        transcript_status: 'completed',
      })
      .eq('id', echoId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      transcript,
    })
  } catch (error) {
    console.error('Transcription error:', error)

    // Update echo status to failed
    try {
      const supabase = createClient()
      await supabase
        .from('echoes')
        .update({ transcript_status: 'failed' })
        .eq('id', (await request.json()).echoId)
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
