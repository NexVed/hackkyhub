import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type DashboardStats = FunctionReturnType<typeof api.analytics.getDashboardStats>;

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/dashboard/" }),
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({ query: () => "stats" }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;

export function useDashboardStats() {
  return useGetDashboardStatsQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: 60,
  });
}
