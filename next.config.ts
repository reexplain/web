import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
