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

};

export default nextConfig;
