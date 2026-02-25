import type { NextConfig } from "next";
// @ts-expect-error - next-pwa doesn't have TypeScript types
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  turbopack: {}, // Empty config to silence Turbopack/webpack warning
  output: 'standalone', // Enable standalone output for Docker deployment
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
