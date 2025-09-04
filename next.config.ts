import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    swcPlugins: [],
  },
  env: {
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  },
};

export default nextConfig;
