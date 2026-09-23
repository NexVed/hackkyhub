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
      const body = await request.json();

      if (!Array.isArray(body.hackathons)) {
        return new Response(
          JSON.stringify({
            error: "hackathons must be an array",
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