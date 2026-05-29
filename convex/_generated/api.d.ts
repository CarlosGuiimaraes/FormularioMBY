/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as GmailOTPPasswordReset from "../GmailOTPPasswordReset.js";
import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as auth from "../auth.js";
import type * as authInfo from "../authInfo.js";
import type * as gmailSend from "../gmailSend.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as posConstants from "../posConstants.js";
import type * as posOrders from "../posOrders.js";
import type * as router from "../router.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  GmailOTPPasswordReset: typeof GmailOTPPasswordReset;
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  auth: typeof auth;
  authInfo: typeof authInfo;
  gmailSend: typeof gmailSend;
  http: typeof http;
  orders: typeof orders;
  posConstants: typeof posConstants;
  posOrders: typeof posOrders;
  router: typeof router;
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
