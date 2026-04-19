import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ethers", "openai", "node-cron"],
};

export default nextConfig;
