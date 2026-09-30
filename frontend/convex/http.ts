import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/api/hackathons/sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authorization = request.headers.get("Authorization");
    const expectedToken = process.env.SCRAPER_SYNC_TOKEN;

    if (
      !expectedToken ||
      authorization !== `Bearer ${expectedToken}`
    ) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    try {
      // Bound the streaming body too: Content-Length can be absent or forged.
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 2_000_000) {
            await reader.cancel();
            return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: { "Content-Type": "application/json" } });
          }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const body: unknown = JSON.parse(new TextDecoder().decode(bytes));

      if (!body || typeof body !== "object" || !("hackathons" in body) || !Array.isArray(body.hackathons) || body.hackathons.length > 1000) {
        return new Response(
          JSON.stringify({
            error: "hackathons must be an array of at most 1000 records",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      const result = await ctx.runMutation(
        internal.hackathonPipeline.syncHackathons,
        {
          hackathons: body.hackathons,
        },
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }),
});

export default http;
