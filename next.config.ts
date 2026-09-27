import type { NextConfig } from "next";

// Máy build nhỏ (Render gói Free ~512 MB RAM): đặt LOW_MEMORY_BUILD=1 để
// bỏ bước kiểm tra kiểu và chỉ dùng 1 luồng -> giảm RAM khi build.
const lowMem = process.env.LOW_MEMORY_BUILD === "1";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
    ...(lowMem ? { cpus: 1, workerThreads: false, webpackMemoryOptimizations: true } : {}),
  },
  ...(lowMem ? { typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true } } : {}),
};

export default nextConfig;
