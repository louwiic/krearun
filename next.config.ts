import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/porte-boisson/demandes/*/export": ["./assets/holder-manufacturing/**", "./scripts/holder-export-worker.mjs", "./lib/holder-manufacturing*.mjs", "./lib/holder-text.mjs", "./public/fonts/DejaVuSansCondensed-Bold.ttf", "./node_modules/manifold-3d/**"],
    "/api/custom-letter/*": ["./public/fonts/LibreBaskerville.ttf", "./public/fonts/Lobster-Regular.ttf"],
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
