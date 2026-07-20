import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    // Cache prefetched pages client-side so repeat navigations are instant.
    // dynamic: pages without full prefetch (default 0s → 5 min)
    // static: fully prefetched / static pages (default 5 min → 5 min)
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default nextConfig;
