import type { ProblemDetails } from "@easyid/types";

/**
 * Thrown for any non-2xx response from the API. Wraps the server's
 * RFC 7807 Problem Details payload so callers can
 * `catch (e) { if (e instanceof ApiClientError) … }` without inspecting the body.
 */
export class ApiClientError extends Error {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly errors?: unknown;

  constructor(problem: ProblemDetails) {
    super(problem.detail);
    this.name = "ApiClientError";
    this.type = problem.type;
    this.title = problem.title;
    this.status = problem.status;
    this.detail = problem.detail;
    if (problem.instance !== undefined) {
      this.instance = problem.instance;
    }
    if (problem.request_id !== undefined) {
      this.requestId = problem.request_id;
    }
    if (problem.correlation_id !== undefined) {
      this.correlationId = problem.correlation_id;
    }
    if (problem.errors !== undefined) {
      this.errors = problem.errors;
    }
  }
}
