'use client';

import Link from 'next/link';
import { Echo } from '@/types/echo';

interface EchoCardProps {
  echo: Echo;
  onReEcho: (echoId: string, confirm: boolean) => void;
  onReEchoClick: (echoId: string) => void;
  disabled?: boolean;
  isConfirmationActive: boolean;
  hasActiveConfirmation: boolean;
  isNewlyUploaded?: boolean;
}

export default function EchoCard({
  echo,
  onReEcho,
  onReEchoClick,
  disabled = false,
  isConfirmationActive,
  hasActiveConfirmation,
  isNewlyUploaded = false
}: EchoCardProps) {
  const handleReEchoClick = () => {
    if (!echo.hasReEchoed && !disabled && !hasActiveConfirmation) {
      onReEchoClick(echo.id);
    }
  };

  const handleConfirm = () => {
    onReEcho(echo.id, true);
  };

  const handleCancel = () => {
    onReEcho(echo.id, false);
  };

  return (
    <div className={`bg-white border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors ${isNewlyUploaded ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
      {isNewlyUploaded && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Just uploaded
          </span>
        </div>
      )}
      <div className="flex gap-3">
        {/* Avatar Circle */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: echo.avatarColor || '#D1D5DB' }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/echo/${echo.id}`} className="block">
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">{echo.title}</h3>
            <p className="text-sm text-gray-500 mb-2">@{echo.username}</p>

            <div className="flex items-center gap-3 text-sm text-gray-600">
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
                <span>{echo.distance} ft away</span>
              </div>

              {/* Seen count */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>{echo.seenCount}</span>
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
            </div>
          </Link>
        </div>

        {/* Re-echo button on the right */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isConfirmationActive ? (
            <button
              onClick={handleReEchoClick}
              disabled={echo.hasReEchoed || disabled || hasActiveConfirmation}
              className={`p-2 rounded-full transition-colors ${
                echo.hasReEchoed || disabled || hasActiveConfirmation
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Re-echo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleConfirm}
                className="w-8 h-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
                aria-label="Confirm re-echo"
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
                onClick={handleCancel}
                className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
                aria-label="Cancel re-echo"
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
      </div>
    </div>
  );
}
