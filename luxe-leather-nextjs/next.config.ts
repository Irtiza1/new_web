import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Override turbopack workspace resolution root
    root: import.meta.dirname || process.cwd(),
  }
};

export default nextConfig;
