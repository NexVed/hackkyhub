import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
