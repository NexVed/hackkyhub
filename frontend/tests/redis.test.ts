import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@upstash/redis", () => ({ Redis: class { get = mocks.get; set = mocks.set; } }));

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  mocks.get.mockResolvedValue(null); mocks.set.mockResolvedValue("OK");
});
afterEach(() => vi.unstubAllEnvs());

describe("optional Redis cache", () => {
  test("missing credentials bypass Redis", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { cached } = await import("../lib/redis");
    expect(await cached("key", 60, async () => ({ total: 12 }))).toEqual({ data: { total: 12 }, cache: "BYPASS" });
    expect(mocks.get).not.toHaveBeenCalled();
  });
  test("a cache hit avoids fetching from Convex", async () => {
    mocks.get.mockResolvedValue({ total: 4 });
    const source = vi.fn();
    const { cached } = await import("../lib/redis");
    expect(await cached("key", 60, source)).toEqual({ data: { total: 4 }, cache: "HIT" });
    expect(source).not.toHaveBeenCalled();
  });
  test("a miss stores a fresh response with an expiry", async () => {
    const { cached } = await import("../lib/redis");
    await cached("key", 60, async () => ({ total: 8 }));
    expect(mocks.set).toHaveBeenCalledWith("key", { total: 8 }, { ex: 60 });
  });
  test("Redis read and write failures still return fresh data", async () => {
    mocks.get.mockRejectedValue(new Error("Redis unavailable"));
    mocks.set.mockRejectedValue(new Error("Redis unavailable"));
    const { cached } = await import("../lib/redis");
    expect((await cached("key", 60, async () => ({ total: 9 }))).data).toEqual({ total: 9 });
  });
  test("source failures propagate instead of caching an error", async () => {
    const { cached } = await import("../lib/redis");
    await expect(cached("key", 60, async () => { throw new Error("Convex unavailable"); })).rejects.toThrow("Convex unavailable");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
