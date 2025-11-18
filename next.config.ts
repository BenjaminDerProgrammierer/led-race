import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker containerization
  output: 'standalone',
  
  // Allow media*.giphy.com images for player states
  images: {
    remotePatterns: [

      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media1.giphy.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media2.giphy.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media3.giphy.com',
        port: '',
        pathname: '/**',
      },
    ]
  },
};

export default nextConfig;
