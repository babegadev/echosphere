import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Required headers for FFmpeg.wasm (SharedArrayBuffer support)
  // Only apply to specific routes that need FFmpeg (create-echo page)
  async headers() {
    return [
      {
        source: '/create-echo',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
