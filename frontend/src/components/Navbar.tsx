'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const activeColor = '#F8E880'; // Yellow color
  const inactiveColor = '#6B7280'; // Gray color

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="max-w-md mx-auto px-6 py-3 flex items-end justify-center gap-24 relative">
        {/* Home/Feed Button - Left */}
        <Link
          href="/feed"
          className="flex items-center justify-center"
        >
          <svg
            className="w-8 h-8"
            fill={pathname === '/feed' ? activeColor : inactiveColor}
            viewBox="0 0 24 24"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>

        {/* Echo Button (Elevated) - Center */}
        <Link
          href="/create-echo"
          className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-colors"
          style={{
            background: 'linear-gradient(87deg, #F8E880 32.94%, #FBF2B7 94.43%)'
          }}
        >
          <svg
            className="w-8 h-8 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </Link>

        {/* Settings Button - Right */}
        <Link
          href="/settings"
          className="flex items-center justify-center"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke={pathname === '/settings' ? activeColor : inactiveColor}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="5" r="1.5" fill={pathname === '/settings' ? activeColor : inactiveColor} />
            <circle cx="12" cy="12" r="1.5" fill={pathname === '/settings' ? activeColor : inactiveColor} />
            <circle cx="12" cy="19" r="1.5" fill={pathname === '/settings' ? activeColor : inactiveColor} />
            <line x1="4" y1="5" x2="10" y2="5" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="5" x2="20" y2="5" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="12" x2="10" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="19" x2="10" y2="19" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="19" x2="20" y2="19" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
