import type { ApiError } from "@easyid/types";

/**
 * Thrown for any non-2xx response from the API. Wraps the server's
 * `ApiError` payload so callers can `catch (e) { if (e instanceof
 * ApiClientError) … }` without inspecting the body.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly traceId?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = error.status;
    this.code = error.code;
    if (error.details !== undefined) {
      this.details = error.details;
    }
    if (error.traceId !== undefined) {
      this.traceId = error.traceId;
    }
  }
}
