import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
/** Process liveness only; external dependency health has separate alerts. */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
