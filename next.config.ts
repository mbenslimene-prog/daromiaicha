import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-ical"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "madainproject.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "a0.muscache.com" },
    ],
  },
};

export default nextConfig;
