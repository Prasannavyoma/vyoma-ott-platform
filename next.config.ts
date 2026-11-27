import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    'localhost:3000',
    '*.loca.lt',
    '*.lhr.life'
  ],
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  } as any,
  turbopack: {
    root: process.cwd(),
  },
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  outputFileTracingIncludes: {
    '/*': ['./global-bundle.pem'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any HTTPS domain for extreme flexibility since image sources vary
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
