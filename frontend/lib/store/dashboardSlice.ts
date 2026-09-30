import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ExplorerScope = "overview" | "find" | "mnc";
export type ExplorerFilters = {
  search: string;
  phase: "upcoming" | "ongoing" | "completed" | null;
  mode: "online" | "offline" | null;
  platform: string | null;
  mncOnly: boolean;
};

const defaults = (): ExplorerFilters => ({ search: "", phase: null, mode: null, platform: null, mncOnly: false });
const initialState = {
  explorers: { overview: defaults(), find: defaults(), mnc: { ...defaults(), mncOnly: true } },
  selectedTeamId: null as string | null,
  teamSearch: "",
};

const slice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setExplorerFilters(state, action: PayloadAction<{ scope: ExplorerScope; filters: Partial<ExplorerFilters> }>) {
      Object.assign(state.explorers[action.payload.scope], action.payload.filters);
      state.explorers.mnc.mncOnly = true;
    },
    resetExplorerFilters(state, action: PayloadAction<ExplorerScope>) {
      state.explorers[action.payload] = { ...defaults(), mncOnly: action.payload === "mnc" };
    },
    selectTeam(state, action: PayloadAction<string | null>) { state.selectedTeamId = action.payload; },
    setTeamSearch(state, action: PayloadAction<string>) { state.teamSearch = action.payload; },
    resetDashboardState() { return initialState; },
  },
});

export const { setExplorerFilters, resetExplorerFilters, selectTeam, setTeamSearch, resetDashboardState } = slice.actions;
export default slice.reducer;
