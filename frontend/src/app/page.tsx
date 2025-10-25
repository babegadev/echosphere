'use client';

import { useState, useMemo } from 'react';
import EchoCard from '@/components/EchoCard';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { Echo } from '@/types/echo';
import { useEcho } from '@/contexts/EchoContext';

// Mock data for demonstration
const mockEchos: Echo[] = [
  {
    id: '1',
    title: 'The Future of AI in Healthcare',
    username: 'aubreyasta_',
    avatarColor: '#C0C0C0',
    distance: 12,
    reEchoCount: 8,
    seenCount: 12,
    audioUrl: '/audio/sample1.mp3',
    transcript: 'This is a transcript of the echo about AI in healthcare...',
    hasReEchoed: false,
    createdAt: '2025-10-25T12:00:00Z',
  },
  {
    id: '2',
    title: 'Coffee Shop Reviews Downtown',
    username: 'jadon_rybak',
    avatarColor: '#FFB6C1',
    distance: 7,
    reEchoCount: 359,
    seenCount: 450,
    audioUrl: '/audio/sample2.mp3',
    transcript: 'Here are my thoughts on the best coffee shops downtown...',
    hasReEchoed: false,
    createdAt: '2025-10-25T11:00:00Z',
  },
  {
    id: '3',
    title: 'Morning Meditation Tips',
    username: 'amel',
    avatarColor: '#FFD700',
    distance: 19,
    reEchoCount: 116,
    seenCount: 890,
    audioUrl: '/audio/sample3.mp3',
    transcript: 'Let me share some meditation techniques that work for me...',
    hasReEchoed: false,
    createdAt: '2025-10-25T10:00:00Z',
  },
  {
    id: '4',
    title: 'Local Music Scene Update',
    username: 'indy_mindy',
    avatarColor: '#87CEEB',
    distance: 31,
    reEchoCount: 133,
    seenCount: 320,
    audioUrl: '/audio/sample4.mp3',
    transcript: 'The local music scene has been amazing lately...',
    hasReEchoed: false,
    createdAt: '2025-10-25T09:00:00Z',
  },
  {
    id: '5',
    title: 'Best Hiking Trails Nearby',
    username: 'dimi',
    avatarColor: '#98FB98',
    distance: 43,
    reEchoCount: 68,
    seenCount: 180,
    audioUrl: '/audio/sample5.mp3',
    transcript: 'I want to share the best hiking trails in our area...',
    hasReEchoed: false,
    createdAt: '2025-10-25T08:00:00Z',
  },
];

export default function Home() {
  const { newEchos } = useEcho();
  const [echos, setEchos] = useState<Echo[]>(mockEchos);
  const [activeConfirmationId, setActiveConfirmationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Combine new echos with existing echos
  const allEchos = useMemo(() => {
    return [...newEchos, ...echos];
  }, [newEchos, echos]);

  const handleReEchoClick = (echoId: string) => {
    setActiveConfirmationId(echoId);
  };

  const handleReEcho = (echoId: string, confirm: boolean) => {
    if (confirm) {
      // Update the echo to mark it as re-echoed
      setEchos((prevEchos) =>
        prevEchos.map((echo) =>
          echo.id === echoId
            ? { ...echo, hasReEchoed: true, reEchoCount: echo.reEchoCount + 1 }
            : echo
        )
      );
      setToast({ message: 'Echo re-echoed successfully!', type: 'success' });
    } else {
      setToast({ message: 'Re-echo cancelled', type: 'error' });
    }
    setActiveConfirmationId(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Echo</h1>
          </div>
        </header>

        {/* Echo List */}
        <main className="max-w-md mx-auto">
          {allEchos.map((echo, index) => (
            <EchoCard
              key={echo.id}
              echo={echo}
              onReEcho={handleReEcho}
              onReEchoClick={handleReEchoClick}
              disabled={false}
              isConfirmationActive={activeConfirmationId === echo.id}
              hasActiveConfirmation={activeConfirmationId !== null}
              isNewlyUploaded={index < newEchos.length}
            />
          ))}
        </main>

        {/* Navbar */}
        <Navbar />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}
