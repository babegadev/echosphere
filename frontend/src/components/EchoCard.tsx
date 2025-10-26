'use client';

import Link from 'next/link';
import { Echo } from '@/types/echo';

// Helper function to format distance for display
function formatDistanceDisplay(feet: number): string {
  if (feet === 0) return 'Unknown distance';

  // If distance is more than 1000 feet, show in miles
  if (feet >= 1000) {
    const miles = (feet / 5280).toFixed(1);
    return `${miles} mi away`;
  }

  // Otherwise show in feet
  return `${feet.toLocaleString()} ft away`;
}

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
  return (
    <Link href={`/echo/${echo.id}`}>
      <div className="bg-black border-b border-gray-800 px-4 py-3 hover:bg-gray-900 transition-colors">
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          {echo.avatarUrl ? (
            <img
              src={echo.avatarUrl}
              alt={`@${echo.username}`}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: echo.avatarColor || '#D1D5DB' }}
            />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-0.5 line-clamp-1">
              {echo.title}
            </h3>
            <p className="text-sm text-gray-400 mb-2">@{echo.username}</p>

            <div className="flex items-center gap-3 text-sm text-gray-400">
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
                <span>{formatDistanceDisplay(echo.distance)}</span>
              </div>

              {/* Seen count (heart) */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
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
          </div>

          {/* Flag icon on the right */}
          <div className="flex-shrink-0">
            <button
              className="p-2 text-gray-600 hover:text-gray-400 transition-colors"
              aria-label="Flag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add flag functionality here later
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
