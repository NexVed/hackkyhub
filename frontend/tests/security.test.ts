/// <reference types="vite/client" />
import { afterEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { normalizeSocialLinks } from "../convex/lib/socialLinks";
const modules = import.meta.glob("../convex/**/*.{ts,js}");
afterEach(() => vi.unstubAllEnvs());

describe("social links and account isolation", () => {
  test("links accept platform HTTPS profiles, normalize tracking and reject unsafe destinations", () => {
    expect(normalizeSocialLinks({ github: " https://github.com/builder?tab=repositories#about ", linkedin:"https://www.linkedin.com/in/builder", reddit:"https://www.reddit.com/user/builder", x:"https://twitter.com/builder" })).toEqual({github:"https://github.com/builder", linkedin:"https://www.linkedin.com/in/builder", reddit:"https://www.reddit.com/user/builder",x:"https://twitter.com/builder"});
    expect(normalizeSocialLinks({ github:"", x:" " })).toEqual({});
    for (const url of ["javascript:alert(1)", "http://github.com/builder", "https://github.com.evil.test/builder", "https://github.com@evil.test/builder", "https://evil@github.com/builder", "https://github.com/", "https://github.com:8080/builder"]) expect(() => normalizeSocialLinks({github:url})).toThrow();
  });
  test("only the signed-in account can save profile links and its private library", async () => {
    const t=convexTest(schema,modules);
    const [a,b,hackathonId] = await t.run(async ctx => Promise.all([ctx.db.insert("users",{name:"Alice"}),ctx.db.insert("users",{name:"Bob"}),ctx.db.insert("hackathons",{name:"Security fixture",url:"https://devpost.com/fixture",platform:"devpost",is_online:true,status:"upcoming",scraped_from:"test",created_at:new Date().toISOString()})]));
    const alice=t.withIdentity({subject:a}), bob=t.withIdentity({subject:b});
    await expect(t.mutation(api.users.updateMyProfile,{displayName:"Attacker",socialLinks:{github:"https://github.com/attacker"}})).rejects.toThrow("Sign in");
    await alice.mutation(api.users.updateMyProfile,{displayName:"Alice",socialLinks:{github:"https://github.com/alice"}});
    await alice.mutation(api.userLibrary.toggleSave,{hackathonId});
    await alice.mutation(api.registrations.start,{hackathonId});
    expect((await alice.query(api.users.viewer,{}))?.socialLinks.github).toBe("https://github.com/alice");
    expect((await bob.query(api.users.viewer,{}))?.socialLinks).toEqual({});
    expect(await bob.query(api.userLibrary.listSavedIds,{})).toEqual([]);
    expect(await bob.query(api.registrations.getMine,{hackathonId})).toBeNull();
    await bob.mutation(api.registrations.remove,{hackathonId});
    expect(await alice.query(api.registrations.getMine,{hackathonId})).not.toBeNull();
    await alice.mutation(api.users.updateMyProfile,{displayName:"Alice",socialLinks:{github:""}});
    expect((await alice.query(api.users.viewer,{}))?.socialLinks).toEqual({});
  });
});

test("ingestion rejects executable URLs and unsafe optional links", async () => {
  const t=convexTest(schema,modules);
  const result=await t.mutation(internal.hackathonPipeline.syncHackathons,{hackathons:[{name:"Unsafe",url:"javascript:alert(1)",platform:"test"},{name:"Safe",url:"https://devpost.com/safe",platform:"devpost",redirect_url:"javascript:alert(1)",banner_url:"data:text/html,bad",prize_amount:-1}]});
  expect(result).toMatchObject({inserted:1,skipped:1});
  const rows=await t.run(ctx=>ctx.db.query("hackathons").collect());
  expect(rows[0].redirect_url).toBeUndefined(); expect(rows[0].banner_url).toBeUndefined(); expect(rows[0].prize_amount).toBeUndefined();
});

test("sync rejects missing authorization and oversized batches", async () => {
  vi.stubEnv("SCRAPER_SYNC_TOKEN","test-sync-secret");
  const t=convexTest(schema,modules);
  expect((await t.fetch("/api/hackathons/sync",{method:"POST",body:"{}"})).status).toBe(401);
  expect((await t.fetch("/api/hackathons/sync",{method:"POST",headers:{Authorization:"Bearer test-sync-secret"},body:JSON.stringify({hackathons:Array(1001).fill({})})})).status).toBe(400);
  expect((await t.fetch("/api/hackathons/sync",{method:"POST",headers:{Authorization:"Bearer test-sync-secret"},body:JSON.stringify({hackathons:[],padding:"x".repeat(2_000_001)})})).status).toBe(413);
});
