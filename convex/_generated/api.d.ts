/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as audio from "../audio.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as key from "../key.js";
import type * as lib from "../lib.js";
import type * as messages from "../messages.js";
import type * as sets from "../sets.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  audio: typeof audio;
  auth: typeof auth;
  http: typeof http;
  key: typeof key;
  lib: typeof lib;
  messages: typeof messages;
  sets: typeof sets;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
