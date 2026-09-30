import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { cached } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Shared, public aggregates only. Personal data never enters this cache. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return NextResponse.json({ error: "Dashboard data is not configured." }, { status: 503 });
  try {
    const namespace = createHash("sha256").update(url).digest("hex").slice(0, 16);
    const result = await cached(`hackkyhub:${namespace}:dashboard:stats:v1`, 60, () => new ConvexHttpClient(url).query(api.analytics.getDashboardStats, {}));
    return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store", "X-HackkyHub-Cache": result.cache } });
  } catch {
    return NextResponse.json({ error: "Dashboard data is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
