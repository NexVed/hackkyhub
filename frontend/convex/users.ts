import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { normalizeSocialLinks } from "./lib/socialLinks";

const LIMITS = { displayName: 60, headline: 80, location: 60 } as const;

async function profileOf(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

/** Collapses whitespace and drops control characters. */
function clean(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * The signed-in user's own account, or null when signed out.
 *
 * `name` is the name the user chose in Settings when set, otherwise the one
 * their sign-in provider supplied (Google/GitHub), otherwise null.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;

    const profile = await profileOf(ctx, userId);
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .take(10);
    const providers = [...new Set(accounts.map((account) => account.provider))];

    return {
      _id: user._id,
      name: profile?.displayName ?? user.name ?? null,
      providerName: user.name ?? null,
      email: user.email ?? null,
      emailVerified: user.emailVerificationTime !== undefined,
      image: user.image ?? null,
      headline: profile?.headline ?? null,
      location: profile?.location ?? null,
      socialLinks: profile?.socialLinks ?? {},
      providers,
      joinedAt: user._creationTime,
    };
  },
});

/**
 * Saves the signed-in user's display details. An empty headline or location
 * clears it; the display name is required.
 */
export const updateMyProfile = mutation({
  args: {
    displayName: v.string(),
    headline: v.optional(v.string()),
    location: v.optional(v.string()),
    socialLinks: v.optional(v.object({ github: v.optional(v.string()), linkedin: v.optional(v.string()), reddit: v.optional(v.string()), x: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Sign in to edit your profile.");

    const displayName = clean(args.displayName);
    const headline = args.headline === undefined ? undefined : clean(args.headline);
    const location = args.location === undefined ? undefined : clean(args.location);

    if (displayName.length < 2) throw new ConvexError("Name must be at least 2 characters.");
    if (displayName.length > LIMITS.displayName) {
      throw new ConvexError(`Name must be at most ${LIMITS.displayName} characters.`);
    }
    if (headline && headline.length > LIMITS.headline) {
      throw new ConvexError(`Headline must be at most ${LIMITS.headline} characters.`);
    }
    if (location && location.length > LIMITS.location) {
      throw new ConvexError(`Location must be at most ${LIMITS.location} characters.`);
    }

    let socialLinks;
    try { socialLinks = args.socialLinks === undefined ? undefined : normalizeSocialLinks(args.socialLinks); }
    catch (error) { throw new ConvexError(error instanceof Error ? error.message : "Invalid social link."); }
    const fields = {
      displayName,
      headline: headline || undefined,
      location: location || undefined,
      updatedAt: Date.now(),
      ...(socialLinks === undefined ? {} : { socialLinks }),
    };
    const existing = await profileOf(ctx, userId);
    if (existing === null) {
      await ctx.db.insert("profiles", { userId, ...fields });
    } else {
      await ctx.db.patch(existing._id, fields);
    }
    return null;
  },
});
