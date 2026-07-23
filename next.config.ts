import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    'petite-nights-bow.loca.lt',
    'smooth-moments-post.loca.lt',
    '35c9e5a250fe84.lhr.life',
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
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      }
    ];
  },
};

export default nextConfig;
