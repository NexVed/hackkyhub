import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const MAX_TEAMS = 20;
const MAX_MEMBERS = 10;

async function requireUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Sign in to manage teams.");
  return userId;
}

function details(name: string, description: string, skills: string[]) {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (trimmed.length < 2 || trimmed.length > 60) throw new ConvexError("Team name must be 2–60 characters.");
  if (description.length > 500) throw new ConvexError("Description must be at most 500 characters.");
  const tags = [...new Set(skills.map((s) => s.trim()).filter(Boolean))];
  if (tags.length > 8 || tags.some((s) => s.length > 30)) throw new ConvexError("Add up to 8 skills, each at most 30 characters.");
  return { name: trimmed, description: description.trim(), skills: tags };
}

async function checkTeamLimit(ctx: MutationCtx, userId: Id<"users">) {
  const teams = await ctx.db.query("teamMembers").withIndex("by_userId", (q) => q.eq("userId", userId)).take(MAX_TEAMS);
  if (teams.length >= MAX_TEAMS) throw new ConvexError("You can belong to up to 20 teams.");
}

/** Only returns the caller's teams. Email addresses stay private. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db.query("teamMembers").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(MAX_TEAMS);
    const teams = await Promise.all(memberships.map(async (membership) => {
      const team = await ctx.db.get(membership.teamId);
      if (!team) return null;
      const rows = await ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(MAX_MEMBERS);
      const members = await Promise.all(rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", row.userId)).unique();
        return { _id: row._id, userId: row.userId, name: profile?.displayName ?? user?.name ?? "Team member", image: user?.image ?? null, headline: profile?.headline ?? null };
      }));
      const hackathon = team.hackathonId ? await ctx.db.get(team.hackathonId) : null;
      return { ...team, isOwner: team.ownerId === userId, members, hackathon };
    }));
    return teams.filter((team) => team !== null);
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.string(), skills: v.array(v.string()), inviteCode: v.string(), hackathonId: v.optional(v.id("hackathons")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await checkTeamLimit(ctx, userId);
    // The browser supplies a cryptographically random UUID, never an identity.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(args.inviteCode)) throw new ConvexError("Invalid invitation code.");
    if (await ctx.db.query("teams").withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode)).unique()) throw new ConvexError("Please try creating the team again.");
    if (args.hackathonId && !await ctx.db.get(args.hackathonId)) throw new ConvexError("Hackathon no longer exists.");
    const teamId = await ctx.db.insert("teams", { ...details(args.name, args.description, args.skills), ownerId: userId, inviteCode: args.inviteCode, hackathonId: args.hackathonId });
    await ctx.db.insert("teamMembers", { teamId, userId });
    return teamId;
  },
});

export const join = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const team = await ctx.db.query("teams").withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode.trim())).unique();
    if (!team) throw new ConvexError("This invitation code is invalid or the team was deleted.");
    const existing = await ctx.db.query("teamMembers").withIndex("by_teamId_and_userId", (q) => q.eq("teamId", team._id).eq("userId", userId)).unique();
    if (existing) return team._id;
    await checkTeamLimit(ctx, userId);
    const members = await ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(MAX_MEMBERS);
    if (members.length >= MAX_MEMBERS) throw new ConvexError("This team is full (10 members maximum).");
    await ctx.db.insert("teamMembers", { teamId: team._id, userId });
    return team._id;
  },
});

export const update = mutation({
  args: { teamId: v.id("teams"), name: v.string(), description: v.string(), skills: v.array(v.string()), hackathonId: v.optional(v.id("hackathons")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== userId) throw new ConvexError("Only the team owner can edit this team.");
    if (args.hackathonId && !await ctx.db.get(args.hackathonId)) throw new ConvexError("Hackathon no longer exists.");
    await ctx.db.patch(team._id, { ...details(args.name, args.description, args.skills), hackathonId: args.hackathonId });
    return null;
  },
});

export const leave = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new ConvexError("Team no longer exists.");
    if (team.ownerId === userId) throw new ConvexError("The owner must delete the team instead of leaving.");
    const membership = await ctx.db.query("teamMembers").withIndex("by_teamId_and_userId", (q) => q.eq("teamId", team._id).eq("userId", userId)).unique();
    if (!membership) throw new ConvexError("You are not a member of this team.");
    await ctx.db.delete(membership._id);
    return null;
  },
});

export const remove = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== userId) throw new ConvexError("Only the owner can delete this team.");
    const members = await ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(MAX_MEMBERS);
    for (const member of members) await ctx.db.delete(member._id);
    await ctx.db.delete(team._id);
    return null;
  },
});
