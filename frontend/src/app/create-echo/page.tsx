'use client';

import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import Toast from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { useEcho } from '@/contexts/EchoContext';
import { Echo } from '@/types/echo';

type RecordingState = 'idle' | 'recording' | 'stopped';

export default function CreateEchoPage() {
  const router = useRouter();
  const { addNewEcho } = useEcho();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('Your Recording');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(recordingTitle);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Reset time states
        setCurrentTime(0);
        setDuration(0);
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

  const handleUpload = () => {
    // Create a new echo object to add to the feed
    const newEcho: Echo = {
      id: `new-${Date.now()}`,
      title: recordingTitle,
      username: 'aubreyasta_', // TODO: Get from user context/auth
      avatarColor: '#3B82F6', // Blue color for newly uploaded echos
      distance: 0, // Just uploaded, so distance is 0
      reEchoCount: 0,
      seenCount: 0,
      audioUrl: audioUrl || '',
      transcript: '', // TODO: Add transcript generation
      hasReEchoed: false,
      createdAt: new Date().toISOString(),
    };

    // Add to feed immediately
    addNewEcho(newEcho);

    // Save to localStorage for uploaded echos
    const uploaded = localStorage.getItem('uploadedEchos');
    const uploadedEchos = uploaded ? JSON.parse(uploaded) : [];
    uploadedEchos.unshift(newEcho); // Add to beginning
    localStorage.setItem('uploadedEchos', JSON.stringify(uploadedEchos));

    // TODO: Implement upload to backend
    setToast({ message: 'Echo uploaded successfully!', type: 'success' });
    setTimeout(() => router.push('/'), 1500);
  };

  const handleArchive = () => {
    // Save to localStorage for now (will be replaced with backend later)
    const archived = localStorage.getItem('archivedEchos');
    const archivedEchos = archived ? JSON.parse(archived) : [];
    archivedEchos.push({
      id: Date.now().toString(),
      url: audioUrl,
      createdAt: new Date().toISOString(),
      title: recordingTitle,
    });
    localStorage.setItem('archivedEchos', JSON.stringify(archivedEchos));

    setToast({ message: 'Echo archived successfully!', type: 'success' });
    setTimeout(() => router.push('/profile'), 1500);
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingState('idle');
    setToast({ message: 'Recording deleted', type: 'error' });
  };

  const handleEditTitle = () => {
    setTempTitle(recordingTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim() === '') {
      setToast({ message: 'Title cannot be empty', type: 'error' });
      return;
    }
    setRecordingTitle(tempTitle);
    setIsEditingTitle(false);
    setToast({ message: 'Title updated!', type: 'success' });
  };

  const handleCancelEdit = () => {
    setTempTitle(recordingTitle);
    setIsEditingTitle(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
          <h1 className="text-xl font-bold text-gray-900">Create Echo</h1>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {recordingState === 'idle' && (
          <div className="text-center">
            <button
              onClick={startRecording}
              className="w-32 h-32 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105"
            >
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
            <p className="mt-6 text-gray-600 text-lg">Tap to start recording</p>
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

            <p className="text-gray-600">Recording in progress...</p>
          </div>
        )}

        {recordingState === 'stopped' && audioUrl && (
          <div className="w-full space-y-6">
            {/* Playback Controls */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                {!isEditingTitle ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">{recordingTitle}</h3>
                    <button
                      onClick={handleEditTitle}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="Edit title"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="Enter title"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      aria-label="Save title"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Cancel edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4 space-y-2">
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
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
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Play/Pause Button */}
              <div className="flex items-center justify-center gap-4">
                {!isPlaying ? (
                  <button
                    onClick={playRecording}
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Upload Echo
              </button>

              <button
                onClick={handleArchive}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Archive & Save
              </button>

              <button
                onClick={handleDelete}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
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
