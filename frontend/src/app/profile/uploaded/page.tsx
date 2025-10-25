'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { Echo } from '@/types/echo';

export default function UploadedEchosPage() {
  const router = useRouter();
  const [uploadedEchos, setUploadedEchos] = useState<Echo[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    // Load uploaded echos from localStorage
    const uploaded = localStorage.getItem('uploadedEchos');
    if (uploaded) {
      setUploadedEchos(JSON.parse(uploaded));
    }
  }, []);

  const handleDeleteEcho = (echoId: string) => {
    const updatedEchos = uploadedEchos.filter((echo) => echo.id !== echoId);
    setUploadedEchos(updatedEchos);
    localStorage.setItem('uploadedEchos', JSON.stringify(updatedEchos));
    setToast({ message: 'Echo deleted successfully', type: 'success' });
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
          <h1 className="text-xl font-bold text-gray-900">Uploaded Echos</h1>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto">
        {uploadedEchos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Uploaded Echos</h2>
            <p className="text-gray-500 text-center">
              Echos you upload will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white">
            <div className="divide-y divide-gray-200">
              {uploadedEchos.map((echo) => (
                <div key={echo.id} className="px-4 py-4">
                  {/* Title and Username */}
                  <div className="flex gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: echo.avatarColor || '#D1D5DB' }}
                    />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {echo.title}
                      </h3>
                      <p className="text-sm text-gray-500">@{echo.username}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEcho(echo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors h-fit"
                      aria-label="Delete echo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>{echo.seenCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>{echo.reEchoCount}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>
                      {new Date(echo.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Audio Player */}
                  <audio controls className="w-full">
                    <source src={echo.audioUrl} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ))}
            </div>
          </div>
        )}
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
  );
}
