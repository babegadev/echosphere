'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { useEcho } from '@/contexts/EchoContext';
import { useAuth } from '@/contexts/AuthContext';
import { Echo } from '@/types/echo';

interface ArchivedEcho {
  id: string;
  url: string;
  createdAt: string;
  title?: string;
  duration?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { addNewEcho } = useEcho();
  const { user } = useAuth();

  const userId = user?.id || 'anonymous';
  const initialUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous';

  const [username, setUsername] = useState(initialUsername);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [archivedEchos, setArchivedEchos] = useState<ArchivedEcho[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    // Update username when user changes
    if (user) {
      const newUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'anonymous';
      setUsername(newUsername);
      setTempUsername(newUsername);
    }
  }, [user]);

  useEffect(() => {
    // Load archived echos from localStorage
    const archived = localStorage.getItem('archivedEchos');
    if (archived) {
      setArchivedEchos(JSON.parse(archived));
    }
  }, []);

  const handleEditUsername = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (tempUsername.trim() === '') {
      setToast({ message: 'Username cannot be empty', type: 'error' });
      return;
    }
    setUsername(tempUsername);
    setIsEditingUsername(false);
    setToast({ message: 'Username updated successfully!', type: 'success' });
  };

  const handleCancelEdit = () => {
    setTempUsername(username);
    setIsEditingUsername(false);
  };

  const handleDeleteEcho = (echoId: string) => {
    const updatedEchos = archivedEchos.filter((echo) => echo.id !== echoId);
    setArchivedEchos(updatedEchos);
    localStorage.setItem('archivedEchos', JSON.stringify(updatedEchos));
    setToast({ message: 'Echo deleted successfully', type: 'success' });
  };

  const handleUploadEcho = (echoId: string) => {
    // Find the archived echo
    const archivedEcho = archivedEchos.find((echo) => echo.id === echoId);
    if (!archivedEcho) return;

    // Create a new echo object to add to the feed
    const newEcho: Echo = {
      id: `uploaded-${Date.now()}`,
      title: archivedEcho.title || 'Untitled Echo',
      username: username, // Use the current user's username
      avatarColor: '#3B82F6', // Blue color for newly uploaded echos
      distance: 0, // Just uploaded, so distance is 0
      reEchoCount: 0,
      seenCount: 0,
      audioUrl: archivedEcho.url,
      transcript: '', // TODO: Add transcript generation
      hasReEchoed: false,
      createdAt: new Date().toISOString(),
      duration: archivedEcho.duration || 0,
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

    // Navigate to feed page after a short delay
    setTimeout(() => router.push('/feed'), 1500);

    // Optionally, remove from archived after upload
    // const updatedEchos = archivedEchos.filter((echo) => echo.id !== echoId);
    // setArchivedEchos(updatedEchos);
    // localStorage.setItem('archivedEchos', JSON.stringify(updatedEchos));
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
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto">
        {/* Profile Avatar */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900">@{username}</h2>
          </div>
        </div>

        {/* User ID (Unchangeable) */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-500 block mb-1">
                User ID
              </label>
              <p className="text-base text-gray-900 font-mono">{userId}</p>
            </div>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">This ID cannot be changed</p>
        </div>

        {/* Username (Editable) */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-500">Username</label>
            {!isEditingUsername && (
              <button
                onClick={handleEditUsername}
                className="text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingUsername ? (
            <div className="space-y-3">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUsername}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-base text-gray-900">@{username}</p>
          )}
        </div>

        {/* My Echos Section */}
        <div className="bg-white mt-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Echos</h2>
          </div>

          {/* Archived Echos Button */}
          <button
            onClick={() => router.push('/profile/archived')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <div className="text-left">
                <span className="text-base font-medium text-gray-900 block">Archived Echos</span>
                <span className="text-sm text-gray-500">{archivedEchos.length} echos</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Uploaded Echos Button */}
          <button
            onClick={() => router.push('/profile/uploaded')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-left">
                <span className="text-base font-medium text-gray-900 block">Uploaded Echos</span>
                <span className="text-sm text-gray-500">View all uploads</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Settings Option */}
        <div className="bg-white mt-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/settings')}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-base font-medium text-gray-900">Settings</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Remove inline archived echos display */}
        {false && archivedEchos.length > 0 && (
          <div className="bg-white mt-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Archived Echos</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {archivedEchos.map((echo) => (
                <div key={echo.id} className="px-4 py-4">
                  {/* Title */}
                  {echo.title && (
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {echo.title}
                    </h3>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {new Date(echo.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDeleteEcho(echo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
                  <audio controls className="w-full mb-3">
                    <source src={echo.url} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>

                  {/* Upload Button */}
                  <button
                    onClick={() => handleUploadEcho(echo.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload Echo
                  </button>
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
