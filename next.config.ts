import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {}, // Empty config to silence Turbopack warning when using --webpack flag
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

// Only apply PWA in production builds
const config =
  process.env.NODE_ENV === "production"
    ? withPWA({
        dest: "public",
        register: true,
        skipWaiting: true,
        disable: false,
      })(nextConfig)
    : nextConfig;

export default config;
