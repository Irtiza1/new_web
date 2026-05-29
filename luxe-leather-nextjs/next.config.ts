import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {
    // Override turbopack workspace resolution root
    root: import.meta.dirname || process.cwd(),
  }
};

export default nextConfig;
