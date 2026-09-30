import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // This does not restrict the shaders, OAuth redirects or Next.js scripts.
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
  devIndicators: false,
  // Pin the workspace root to this folder. Without it, Turbopack infers the
  // root from the nearest lockfile and can end up treating the whole repo
  // (including hackathon-scrapper) as the project.
  turbopack: {
    root: path.join(__dirname),
  },
  // Forgive the common typo of the singular path.
  async redirects() {
    return [
      { source: "/hackathon", destination: "/hackathons", permanent: false },
      { source: "/hackathon/:key", destination: "/hackathons/:key", permanent: false },
      // Keep old bookmarks working while using a URL without spaces.
      { source: "/dashboard/mnc", destination: "/dashboard/mnc-hackathons", permanent: false },
      { source: "/dashboard/MNC%20hackathons", destination: "/dashboard/mnc-hackathons", permanent: false },
      { source: "/dashboard/MNC hackathons", destination: "/dashboard/mnc-hackathons", permanent: false },
    ];
  },
};

export default nextConfig;
