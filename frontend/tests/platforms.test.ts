import { expect, test } from "vitest";
import { allPlatformRows, HACKATHON_PLATFORMS } from "../lib/platforms";

test("missing integrations stay visible without inventing events or dropping custom sources", () => {
  const sources = [{ platform: "devpost", total: 89, upcoming: 28 }, { platform: "custom", total: 2, upcoming: 1 }];
  const rows = allPlatformRows(sources);
  expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(91);
  expect(rows.find(row => row.platform === "custom")).toEqual(sources[1]);
  expect(rows.find(row => row.platform === "devfolio")).toEqual({ platform: "devfolio", total: 0, upcoming: 0 });
  expect(new Set(rows.map(row => row.platform)).size).toBe(HACKATHON_PLATFORMS.length + 1);
  expect(sources).toHaveLength(2);
});
