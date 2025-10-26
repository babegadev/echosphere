'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import Toast from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { useEcho } from '@/contexts/EchoContext';
import { useAuth } from '@/contexts/AuthContext';
import { Echo } from '@/types/echo';
import { uploadEchoAudio, createEcho } from '@/lib/echoes';
import { createArchivedEcho, uploadAudioFile } from '@/lib/archived-echoes';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

type RecordingState = 'idle' | 'recording' | 'stopped';

export default function CreateEchoPage() {
  const router = useRouter();
  const { addNewEcho } = useEcho();
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [recordingTitle] = useState('Untitled Echo');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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

  // Get user's current location
  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          console.log('📍 Location captured:', location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Set a default location if user denies or error occurs
          setUserLocation(null);
          setToast({
            message: 'Location access denied. Echo will use default location.',
            type: 'error'
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setUserLocation(null);
    }
  };

  const startRecording = async () => {
    try {
      // Get user's location when they start recording
      getUserLocation();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Track recording start time
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Update recording duration every 100ms
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 100);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop the recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        // Calculate final recording duration
        const finalDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(finalDuration);
        setDuration(finalDuration);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setCurrentTime(0);

        console.log('🎙️ Recording duration:', finalDuration, 'seconds');
      };

      mediaRecorder.start();
      setRecordingState('recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setToast({ message: 'Could not access microphone', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setRecordingState('stopped');
    }
  };

  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
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
    if (!isFinite(time) || isNaN(time)) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!user) {
      setToast({ message: 'You must be logged in to upload', type: 'error' });
      return;
    }

    if (!audioUrl) {
      setToast({ message: 'No audio to upload', type: 'error' });
      return;
    }

    // Check if duration is valid
    if (duration === 0 || !isFinite(duration) || isNaN(duration)) {
      setToast({ message: 'Invalid recording duration. Please try recording again.', type: 'error' });
      return;
    }

    setToast({ message: 'Uploading echo...', type: 'success' });

    try {
      // Convert the blob URL back to a blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Upload audio file to Supabase storage
      const uploadedAudioUrl = await uploadEchoAudio(audioBlob, user.id);

      if (!uploadedAudioUrl) {
        setToast({ message: 'Failed to upload audio', type: 'error' });
        return;
      }

      // Use the duration we tracked during recording
      const audioDuration = Math.floor(duration);

      console.log('📊 Echo duration:', audioDuration, 'seconds');

      // Create echo in database with location
      const newEcho = await createEcho(
        user.id,
        uploadedAudioUrl,
        audioDuration,
        recordingTitle,
        userLocation || undefined, // Pass location if available
        undefined // locationName - can be added later with reverse geocoding
      );

      if (!newEcho) {
        setToast({ message: 'Failed to create echo', type: 'error' });
        return;
      }

      console.log('✅ Echo created with location:', userLocation);

      // No need to add to context - it's already in the database
      // The feed page will fetch it automatically when you navigate there

      setToast({ message: 'Echo uploaded successfully!', type: 'success' });
      setTimeout(() => router.push('/feed'), 1500);
    } catch (error) {
      console.error('Error uploading echo:', error);
      setToast({ message: 'Failed to upload echo', type: 'error' });
    }
  };

  const handleArchive = async () => {
    if (!user) {
      setToast({ message: 'You must be logged in to archive', type: 'error' });
      return;
    }

    if (!audioUrl) {
      setToast({ message: 'No audio to archive', type: 'error' });
      return;
    }

    setToast({ message: 'Archiving echo...', type: 'success' });

    try {
      // Convert the blob URL back to a blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Upload audio file to Supabase storage
      const uploadedAudioUrl = await uploadAudioFile(audioBlob, user.id, 'archived-recording.webm');

      if (!uploadedAudioUrl) {
        setToast({ message: 'Failed to upload audio', type: 'error' });
        return;
      }

      // Calculate duration
      const audioDuration = Math.floor(duration);

      // Create archived echo in database
      const archivedEcho = await createArchivedEcho(
        user.id,
        uploadedAudioUrl,
        recordingTitle,
        audioDuration,
        'manual'
      );

      if (!archivedEcho) {
        setToast({ message: 'Failed to archive echo', type: 'error' });
        return;
      }

      setToast({ message: 'Echo archived successfully!', type: 'success' });
      setTimeout(() => router.push('/profile/archived'), 1500);
    } catch (error) {
      console.error('Error archiving echo:', error);
      setToast({ message: 'Failed to archive echo', type: 'error' });
    }
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingState('idle');
    setToast({ message: 'Recording deleted', type: 'error' });
  };


  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between relative">
          {/* Profile Picture - Left */}
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

          {/* Create Echo Title - Center */}
          <div
            className="px-6 py-3 rounded-full text-black font-semibold text-base font-[family-name:var(--font-roboto)] absolute left-1/2 -translate-x-1/2"
            style={{
              width: '179px',
              height: '50px',
              background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Create Echo
          </div>

          {/* Empty spacer - Right */}
          <div className="w-10 flex-shrink-0"></div>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {recordingState === 'idle' && (
          <div className="flex flex-col items-center justify-center w-full">
            <button
              onClick={startRecording}
              className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 mx-auto"
              style={{
                background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
              }}
            >
              <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
            <p className="mt-6 text-white text-lg text-center">Tap to start recording</p>
          </div>
        )}

        {recordingState === 'recording' && (
          <div className="text-center space-y-6">
            <VoiceVisualizer audioStream={audioStream} isRecording={true} />

            <button
              onClick={stopRecording}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium shadow-lg transition-colors"
            >
              Stop Recording
            </button>

            <p className="text-white">Recording in progress...</p>
          </div>
        )}

        {recordingState === 'stopped' && audioUrl && (
          <div className="w-full space-y-6">
            {/* Playback Controls */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">{recordingTitle}</h3>

              {/* Progress Bar */}
              <div className="mb-4 space-y-2">
                <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-100"
                    style={{
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Play/Pause Button */}
              <div className="flex items-center justify-center gap-4">
                {!isPlaying ? (
                  <button
                    onClick={playRecording}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
                    style={{
                      background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                    }}
                  >
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
                    style={{
                      background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                    }}
                  >
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </button>
                )}
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={(e) => {
                  setCurrentTime(e.currentTarget.currentTime);
                  // Ensure duration is set if it wasn't caught by other events
                  if (duration === 0 && e.currentTarget.duration > 0) {
                    const audioDuration = e.currentTarget.duration;
                    if (isFinite(audioDuration) && !isNaN(audioDuration)) {
                      setDuration(audioDuration);
                    }
                  }
                }}
                onLoadedMetadata={(e) => {
                  const audioDuration = e.currentTarget.duration;
                  if (isFinite(audioDuration) && !isNaN(audioDuration)) {
                    setDuration(audioDuration);
                  }
                }}
                onDurationChange={(e) => {
                  const audioDuration = e.currentTarget.duration;
                  if (isFinite(audioDuration) && !isNaN(audioDuration)) {
                    setDuration(audioDuration);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
                preload="metadata"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpload}
                className="w-full py-3 text-black rounded-lg font-semibold shadow-sm transition-all transform hover:scale-105"
                style={{
                  background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                }}
              >
                Upload Echo
              </button>

              <button
                onClick={handleArchive}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-sm transition-colors border border-gray-600"
              >
                Archive & Save
              </button>

              <button
                onClick={handleDelete}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
              >
                Delete Recording
              </button>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar />
    </div>
  );
}
