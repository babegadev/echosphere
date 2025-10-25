'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AudioVisualizer from '@/components/AudioVisualizer';
import Navbar from '@/components/Navbar';
import { Echo } from '@/types/echo';
import { useEcho } from '@/contexts/EchoContext';

// Mock data - in real app, fetch based on ID
const mockEchos: Record<string, any> = {
  '1': {
    id: '1',
    title: 'The Future of AI in Healthcare',
    distance: 0.7,
    reEchoCount: 359,
    seenCount: 1250,
    audioUrl: '/audio/sample1.mp3',
    transcript:
      'This is a transcript of the echo about AI in healthcare. In this recording, I discuss how artificial intelligence is transforming the healthcare industry, from diagnosis to treatment planning. The integration of machine learning algorithms has enabled doctors to detect diseases earlier and with greater accuracy. We are seeing remarkable improvements in imaging analysis, personalized medicine, and patient care coordination.',
    hasReEchoed: false,
    createdAt: '2025-10-25T12:00:00Z',
  },
  '2': {
    id: '2',
    title: 'Coffee Shop Reviews Downtown',
    distance: 7,
    reEchoCount: 359,
    seenCount: 450,
    audioUrl: '/audio/sample2.mp3',
    transcript: 'Here are my thoughts on the best coffee shops downtown...',
    hasReEchoed: false,
    createdAt: '2025-10-25T11:00:00Z',
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EchoDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { newEchos } = useEcho();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [echo, setEcho] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Load echo data on mount
  useEffect(() => {
    const echoId = resolvedParams.id;

    // First check in newly uploaded echos
    const newEcho = newEchos.find((e) => e.id === echoId);
    if (newEcho) {
      setEcho(newEcho);
      return;
    }

    // Then check in uploaded echos from localStorage
    const uploadedEchos = localStorage.getItem('uploadedEchos');
    if (uploadedEchos) {
      const parsed = JSON.parse(uploadedEchos);
      const uploadedEcho = parsed.find((e: Echo) => e.id === echoId);
      if (uploadedEcho) {
        setEcho(uploadedEcho);
        return;
      }
    }

    // Finally check mock data
    if (mockEchos[echoId]) {
      setEcho(mockEchos[echoId]);
    } else {
      // Fallback to first mock echo if not found
      setEcho(mockEchos['1']);
    }
  }, [resolvedParams.id, newEchos]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeUp = () => {
    const newVolume = Math.min(volume + 0.1, 1);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleVolumeDown = () => {
    const newVolume = Math.max(volume - 0.1, 0);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with back button */}
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
          <h1 className="text-xl font-bold text-gray-900">Echo Details</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {!echo ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Echo Title */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{echo.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{echo.distance} mi away</span>
                <span>•</span>
                <span>{echo.reEchoCount} re-echos</span>
                <span>•</span>
                <span>{echo.seenCount} views</span>
              </div>
            </div>

        {/* Audio Visualizer */}
        <AudioVisualizer isPlaying={isPlaying} />

        {/* Audio Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center gap-4">
            {/* Previous/Skip Backward */}
            <button
              onClick={skipBackward}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Volume Down */}
            <button
              onClick={handleVolumeDown}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Decrease volume"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-5 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Volume Up */}
            <button
              onClick={handleVolumeUp}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Increase volume"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </button>

            {/* Next/Skip Forward */}
            <button
              onClick={skipForward}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            </button>
          </div>

          {/* Volume Indicator */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Volume: {Math.round(volume * 100)}%
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Transcript</h3>
          <p className="text-gray-700 leading-relaxed">{echo.transcript || 'No transcript available'}</p>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={echo.audioUrl} preload="metadata" />
      </>
        )}
      </main>

      <Navbar />
    </div>
  );
}
