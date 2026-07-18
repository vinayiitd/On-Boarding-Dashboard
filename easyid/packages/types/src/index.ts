/**
 * @easyid/types — shared TypeScript types used across the monorepo.
 *
 * Framework-agnostic (no React, no Node-only APIs) so both the web app and
 * the SDK can depend on it.
 */

/**
 * Discriminated result type for I/O boundaries.
 * Prefer this over throwing exceptions across module boundaries.
 */
export type Result<T, E = ApiError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Branded ID helper. Prevents accidentally passing one entity's id where
 * another entity's id is expected — the two are structurally identical
 * (both strings) but nominally distinct at compile time.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * A stable server error contract. Mirrors the FastAPI error responses.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

/**
 * ISO-8601 timestamp string as returned by the API. Not enforced at compile
 * time — the string may still be malformed — but useful as documentation.
 */
export type IsoDateString = string & { readonly __brand: "IsoDateString" };

/**
 * Health check response contract.
 * Kept here (not in @easyid/sdk) so both web and other consumers can depend
 * on it without pulling the client library.
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
}
