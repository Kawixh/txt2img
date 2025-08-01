import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  rewrites: async () => [
    {
      source: '/phrp/static/(.*)',
      destination: 'https://us-assets.i.posthog.com/static/$1',
    },
    {
      source: '/phrp/(.*)',
      destination: 'https://us.i.posthog.com/$1',
    },
  ],
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
