import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to allow development
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
