/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.{ts,js}");
const fields = { name: "Test builders", description: "A test team", skills: ["React"], inviteCode: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };

async function setup() {
  const t = convexTest(schema, modules);
  const [ownerId, memberId, outsiderId] = await t.run(async (ctx) => Promise.all([
    ctx.db.insert("users", { name: "Owner", email: "owner@example.com" }),
    ctx.db.insert("users", { name: "Member", email: "member@example.com" }),
    ctx.db.insert("users", { name: "Outsider", email: "outsider@example.com" }),
  ]));
  return { t, ownerId, owner: t.withIdentity({ subject: ownerId }), member: t.withIdentity({ subject: memberId }), outsider: t.withIdentity({ subject: outsiderId }) };
}

describe("team authorization and membership", () => {
  test("signed-out callers cannot create or join teams", async () => {
    const { t } = await setup();
    await expect(t.mutation(api.teams.create, fields)).rejects.toThrow("Sign in");
    await expect(t.mutation(api.teams.join, { inviteCode: fields.inviteCode })).rejects.toThrow("Sign in");
    expect(await t.query(api.teams.listMine, {})).toEqual([]);
  });

  test("membership is private and joining twice never duplicates a member", async () => {
    const { owner, member, outsider } = await setup();
    const teamId = await owner.mutation(api.teams.create, fields);
    expect(await outsider.query(api.teams.listMine, {})).toEqual([]);
    await member.mutation(api.teams.join, { inviteCode: fields.inviteCode });
    await member.mutation(api.teams.join, { inviteCode: fields.inviteCode });
    const teams = await member.query(api.teams.listMine, {});
    expect(teams[0]._id).toBe(teamId);
    expect(teams[0].members).toHaveLength(2);
    expect(teams[0].isOwner).toBe(false);
    expect(teams[0].members[0]).not.toHaveProperty("email");
  });

  test("members and outsiders cannot edit or delete someone else's team", async () => {
    const { owner, member, outsider } = await setup();
    const teamId = await owner.mutation(api.teams.create, fields);
    await member.mutation(api.teams.join, { inviteCode: fields.inviteCode });
    for (const user of [member, outsider]) {
      await expect(user.mutation(api.teams.update, { teamId, name: "Taken over", description: "", skills: [] })).rejects.toThrow("Only the team owner");
      await expect(user.mutation(api.teams.remove, { teamId })).rejects.toThrow("Only the owner");
    }
    expect((await owner.query(api.teams.listMine, {}))[0].name).toBe(fields.name);
  });

  test("leaving revokes access and deletion removes memberships and invitations", async () => {
    const { t, owner, member } = await setup();
    const teamId = await owner.mutation(api.teams.create, fields);
    await member.mutation(api.teams.join, { inviteCode: fields.inviteCode });
    await expect(owner.mutation(api.teams.leave, { teamId })).rejects.toThrow("owner must delete");
    await member.mutation(api.teams.leave, { teamId });
    expect(await member.query(api.teams.listMine, {})).toEqual([]);
    await member.mutation(api.teams.join, { inviteCode: fields.inviteCode });
    await owner.mutation(api.teams.remove, { teamId });
    expect(await member.query(api.teams.listMine, {})).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("teamMembers").collect())).toEqual([]);
    await expect(member.mutation(api.teams.join, { inviteCode: fields.inviteCode })).rejects.toThrow("invalid");
  });

  test("capacity limits block additional members", async () => {
    const { t, owner, outsider } = await setup();
    const teamId = await owner.mutation(api.teams.create, fields);
    await t.run(async (ctx) => {
      for (let i = 0; i < 9; i++) {
        const userId = await ctx.db.insert("users", { name: `Builder ${i}` });
        await ctx.db.insert("teamMembers", { teamId, userId });
      }
    });
    await expect(outsider.mutation(api.teams.join, { inviteCode: fields.inviteCode })).rejects.toThrow("full");
    expect((await owner.query(api.teams.listMine, {}))[0].members).toHaveLength(10);
  });
});

test("yearly activity includes events older than six months and excludes older years", async () => {
  const { t, owner, ownerId } = await setup();
  const now = Date.now();
  const day = 86_400_000;
  await t.run(async (ctx) => {
    const hackathonId = await ctx.db.insert("hackathons", { name: "Yearly activity test", url: "https://example.com", platform: "test", is_online: true, status: "upcoming", scraped_from: "test", created_at: new Date(now).toISOString() });
    await ctx.db.insert("hackathonViews", { userId: ownerId, hackathonId, viewedAt: now - 240 * day });
    await ctx.db.insert("hackathonViews", { userId: ownerId, hackathonId, viewedAt: now - 380 * day });
    await ctx.db.insert("savedHackathons", { userId: ownerId, hackathonId, savedAt: now - 250 * day });
  });
  const activity = await owner.query(api.userLibrary.getMyActivity, { days: 365 });
  expect(activity?.days).toBe(365);
  expect(activity?.views).toEqual([now - 240 * day]);
  expect(activity?.saves).toEqual([now - 250 * day]);
});
