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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('');
  const [userEchoes, setUserEchoes] = useState<Echo[]>([]);
  const [stats, setStats] = useState({ reEchoes: 0, echoes: 0, likes: 0 });
  const [activeTab, setActiveTab] = useState<'uploaded' | 'archived'>('uploaded');

  useEffect(() => {
    // Load profile data from profiles table
    const loadProfile = async () => {
      if (!user) return;

      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const newUsername = data.username || user.email?.split('@')[0] || 'anonymous';
        setUsername(newUsername);
        setTempUsername(newUsername);
        setAvatarUrl(data.avatar_url);
        setBio(data.bio || '');
        setTempBio(data.bio || '');
      } else {
        // Fallback to user metadata
        const newUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'anonymous';
        setUsername(newUsername);
        setTempUsername(newUsername);
      }
    };

    loadProfile();
    loadUserEchoes();
    loadStats();
  }, [user]);

  const loadUserEchoes = async () => {
    if (!user) return;

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    const { data, error } = await supabase
      .from('echoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const echoes: Echo[] = data.map((echo: any) => ({
        id: echo.id,
        title: echo.title || 'Untitled Echo',
        username: username,
        avatarUrl: avatarUrl,
        avatarColor: '#3B82F6',
        distance: 0,
        reEchoCount: echo.re_echo_count || 0,
        seenCount: echo.seen_count || 0,
        audioUrl: echo.audio_url,
        transcript: echo.transcript || '',
        hasReEchoed: false,
        createdAt: echo.created_at,
        duration: echo.duration || 0,
      }));
      setUserEchoes(echoes);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    // Get total echoes count
    const { count: echoesCount } = await supabase
      .from('echoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get total re-echoes count (echoes that this user re-echoed)
    const { count: reEchoesCount } = await supabase
      .from('re_echoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get total likes count (sum of seen_count from all user's echoes)
    const { data: likesData } = await supabase
      .from('echoes')
      .select('seen_count')
      .eq('user_id', user.id);

    const totalLikes = likesData?.reduce((sum, echo) => sum + (echo.seen_count || 0), 0) || 0;

    setStats({
      reEchoes: reEchoesCount || 0,
      echoes: echoesCount || 0,
      likes: totalLikes,
    });
  };

  useEffect(() => {
    // Load archived echos from database
    loadArchivedEchoes();
  }, []);

  const loadArchivedEchoes = async () => {
    if (!user) return;

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    const { data, error } = await supabase
      .from('archived_echoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const archived: ArchivedEcho[] = data.map((echo: any) => ({
        id: echo.id,
        url: echo.audio_url,
        createdAt: echo.created_at,
        title: echo.title,
        duration: echo.duration,
      }));
      setArchivedEchos(archived);
    }
  };

  const handleEditUsername = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    if (tempUsername.trim() === '') {
      setToast({ message: 'Username cannot be empty', type: 'error' });
      return;
    }

    if (!user) return;

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ username: tempUsername })
      .eq('id', user.id);

    if (error) {
      setToast({ message: 'Failed to update username', type: 'error' });
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

  const handleSaveBio = async () => {
    if (!user) return;

    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ bio: tempBio })
      .eq('id', user.id);

    if (error) {
      setToast({ message: 'Failed to update bio', type: 'error' });
      return;
    }

    setBio(tempBio);
    setIsEditingBio(false);
    setToast({ message: 'Bio updated successfully!', type: 'success' });
  };

  const handleCancelBioEdit = () => {
    setTempBio(bio);
    setIsEditingBio(false);
  };

  const handleDeleteEcho = (echoId: string) => {
    const updatedEchos = archivedEchos.filter((echo) => echo.id !== echoId);
    setArchivedEchos(updatedEchos);
    localStorage.setItem('archivedEchos', JSON.stringify(updatedEchos));
    setToast({ message: 'Echo deleted successfully', type: 'success' });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be less than 5MB', type: 'error' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // Update profiles table with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setToast({ message: 'Profile picture updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setToast({ message: 'Failed to upload profile picture', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
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
    <div className="min-h-screen bg-black pb-20">
      <main className="w-full max-w-md mx-auto px-4 pt-6">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300"
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
        </div>

        {/* Profile Avatar and Username - Centered */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex flex-col items-center">
            <div className="relative group mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-800">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Upload overlay */}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingAvatar ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">@{username}</h2>
          </div>
        </div>

        {/* Stats Section - Centered on Echoes */}
        <div className="relative mb-6 py-4">
          {/* Re-Echoes - Left */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl font-bold text-white mb-1">{stats.reEchoes}</p>
            <p className="text-sm text-gray-400">Re-Echoes</p>
          </div>

          {/* Left Border */}
          <div className="absolute left-1/2 -translate-x-16 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-800"></div>

          {/* Echoes - Center */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl font-bold text-white mb-1">{stats.echoes}</p>
            <p className="text-sm text-gray-400">Echoes</p>
          </div>

          {/* Right Border */}
          <div className="absolute left-1/2 translate-x-16 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-800"></div>

          {/* Likes - Right */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-center">
            <p className="text-2xl font-bold text-white mb-1">{stats.likes}</p>
            <p className="text-sm text-gray-400">Likes</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          {isEditingBio ? (
            <div className="space-y-3">
              <textarea
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white resize-none"
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={150}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBio}
                  className="flex-1 px-4 py-2 text-black rounded-lg font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelBioEdit}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white mb-2">{bio || 'No bio yet. Click to add one.'}</p>
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Edit bio
              </button>
            </div>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'uploaded'
                ? 'text-black'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            style={activeTab === 'uploaded' ? {
              background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
            } : {}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs">Uploaded</span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'archived'
                ? 'text-black'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            style={activeTab === 'archived' ? {
              background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
            } : {}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-xs">Archived</span>
          </button>
        </div>

        {/* Uploaded Echoes Tab */}
        {activeTab === 'uploaded' && (
          <div className="space-y-4">
            {userEchoes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No uploaded echoes yet</p>
                <button
                  onClick={() => router.push('/create-echo')}
                  className="mt-4 px-6 py-2 text-black rounded-lg font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
                  }}
                >
                  Create your first echo
                </button>
              </div>
            ) : (
              userEchoes.map((echo) => (
                <div key={echo.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0"></div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{echo.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">@{username}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(echo.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {echo.audioUrl && (
                        <audio controls className="w-full">
                          <source src={echo.audioUrl} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Archived Echoes Tab */}
        {activeTab === 'archived' && (
          <div className="space-y-4">
            {archivedEchos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No archived echoes yet</p>
              </div>
            ) : (
              archivedEchos.map((echo) => (
                <div key={echo.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0"></div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{echo.title || 'Untitled Echo'}</h3>
                      <p className="text-sm text-gray-400 mb-2">@{username}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(echo.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {echo.url && (
                        <audio controls className="w-full">
                          <source src={echo.url} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Removed old sections */}
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
