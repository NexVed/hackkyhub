/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as hackathonPipeline from "../hackathonPipeline.js";
import type * as hackathons from "../hackathons.js";
import type * as http from "../http.js";
import type * as lib_phase from "../lib/phase.js";
import type * as registrations from "../registrations.js";
import type * as userLibrary from "../userLibrary.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  analytics: typeof analytics;
  auth: typeof auth;
  hackathonPipeline: typeof hackathonPipeline;
  hackathons: typeof hackathons;
  http: typeof http;
  "lib/phase": typeof lib_phase;
  registrations: typeof registrations;
  userLibrary: typeof userLibrary;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
