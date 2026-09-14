import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/custom-letter/*": ["./public/fonts/LibreBaskerville.ttf", "./public/fonts/Lobster-Regular.ttf"],
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
