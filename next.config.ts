// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.(?<domain>.*)',
            },
          ],
          destination: '/s/:subdomain/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
