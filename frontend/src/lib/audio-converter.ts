'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let ffmpegLoaded = false

/**
 * Initialize FFmpeg instance
 */
async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegLoaded && ffmpeg) {
    return ffmpeg
  }

  ffmpeg = new FFmpeg()

  // Load FFmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpegLoaded = true
  console.log('✅ FFmpeg loaded successfully')

  return ffmpeg
}

/**
 * Convert WebM audio to MP3
 * @param webmBlob - The WebM audio blob from MediaRecorder
 * @returns MP3 blob
 */
export async function convertWebMToMP3(webmBlob: Blob): Promise<Blob> {
  try {
    console.log('🔄 Starting WebM to MP3 conversion...')
    console.log('Input blob size:', webmBlob.size, 'bytes')

    // Load FFmpeg
    const ffmpegInstance = await loadFFmpeg()

    // Write input file to FFmpeg virtual filesystem
    const inputFileName = 'input.webm'
    const outputFileName = 'output.mp3'

    await ffmpegInstance.writeFile(inputFileName, await fetchFile(webmBlob))

    // Convert WebM to MP3
    // -i: input file
    // -vn: disable video (audio only)
    // -ar 44100: audio sample rate 44.1kHz
    // -ac 2: audio channels (stereo)
    // -b:a 192k: audio bitrate 192kbps
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-vn',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '192k',
      outputFileName
    ])

    // Read the output file
    const data = await ffmpegInstance.readFile(outputFileName)

    // Create blob from the output data
    const mp3Blob = new Blob([data], { type: 'audio/mpeg' })

    // Clean up files from virtual filesystem
    await ffmpegInstance.deleteFile(inputFileName)
    await ffmpegInstance.deleteFile(outputFileName)

    console.log('✅ Conversion complete!')
    console.log('Output MP3 size:', mp3Blob.size, 'bytes')

    return mp3Blob
  } catch (error) {
    console.error('❌ Error converting audio:', error)
    throw new Error('Failed to convert audio to MP3')
  }
}

/**
 * Check if FFmpeg is supported in the current browser
 */
export function isFFmpegSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
}
