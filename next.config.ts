import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Enable Turbopack explicitly
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
