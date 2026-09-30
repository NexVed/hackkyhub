import { expect, test } from "vitest";
import reducer, { resetDashboardState, resetExplorerFilters, selectTeam, setExplorerFilters } from "../lib/store/dashboardSlice";

test("filters survive navigation without leaking between directories", () => {
  let state = reducer(undefined, setExplorerFilters({ scope: "find", filters: { search: "AI", mode: "online" } }));
  state = reducer(state, selectTeam("team-1"));
  expect(state.explorers.find.search).toBe("AI");
  expect(state.explorers.overview.search).toBe("");
  expect(state.explorers.mnc.search).toBe("");
});

test("corporate-only scope stays locked even when cleared", () => {
  let state = reducer(undefined, setExplorerFilters({ scope: "mnc", filters: { mncOnly: false, search: "Cloud" } }));
  expect(state.explorers.mnc.mncOnly).toBe(true);
  state = reducer(state, resetExplorerFilters("mnc"));
  expect(state.explorers.mnc.mncOnly).toBe(true);
  expect(state.explorers.mnc.search).toBe("");
});

test("sign-out resets team selection and shared searches", () => {
  let state = reducer(undefined, selectTeam("private-team"));
  state = reducer(state, setExplorerFilters({ scope: "find", filters: { search: "private search" } }));
  state = reducer(state, resetDashboardState());
  expect(state.selectedTeamId).toBeNull();
  expect(state.explorers.find.search).toBe("");
});
