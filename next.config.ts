import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16+
  // server-only package handles excluding server modules from client bundle
  turbopack: {},
};

export default nextConfig;
