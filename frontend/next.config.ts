import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder. Without it, Turbopack infers the
  // root from the nearest lockfile and can end up treating the whole repo
  // (including hackathon-scrapper) as the project.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
