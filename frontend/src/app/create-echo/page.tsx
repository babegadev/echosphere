'use client';

import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function CreateEchoPage() {
  const router = useRouter();

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

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Record Your Echo</h2>
          <p className="text-gray-600">Echo recording feature coming soon...</p>
        </div>
      </main>

      <Navbar />
    </div>
  );
}
