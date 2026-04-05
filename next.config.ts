import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "cdnsteam.cdnhell.com", pathname: "/**" },
      { protocol: "https", hostname: "steamcommunity-a.akamaihd.net", pathname: "/**" },
      { protocol: "https", hostname: "community.cloudflare.steamstatic.com", pathname: "/**" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
