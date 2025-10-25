'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Echo } from '@/types/echo';

interface EchoCardProps {
  echo: Echo;
  onReEcho: (echoId: string, confirm: boolean) => void;
}

export default function EchoCard({ echo, onReEcho }: EchoCardProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReEchoClick = () => {
    if (!echo.hasReEchoed) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    onReEcho(echo.id, true);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    onReEcho(echo.id, false);
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
      <Link href={`/echo/${echo.id}`} className="block">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{echo.title}</h3>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* Distance */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{echo.distance} mi away</span>
          </div>

          {/* Re-echo count */}
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

          {/* Seen count */}
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
        </div>
      </Link>

      {/* Re-echo button */}
      <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
        {!showConfirmation ? (
          <button
            onClick={handleReEchoClick}
            disabled={echo.hasReEchoed}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              echo.hasReEchoed
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {echo.hasReEchoed ? 'Re-echoed' : 'Re-echo'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
              aria-label="Confirm re-echo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
              aria-label="Cancel re-echo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}
