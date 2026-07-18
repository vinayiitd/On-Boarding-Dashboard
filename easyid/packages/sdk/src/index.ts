/**
 * @easyid/sdk — the typed HTTP client for the easyID API.
 *
 * Kept intentionally thin: no auth, no retries, no caching. Higher-level
 * concerns belong to the consumer (e.g. TanStack Query in `apps/web`).
 */

export { createClient, type EasyIdClient, type ClientOptions } from "./client";
export { ApiClientError } from "./errors";
