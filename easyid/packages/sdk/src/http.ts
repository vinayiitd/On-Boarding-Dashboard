import type { ProblemDetails } from "@easyid/types";
import { ApiClientError } from "./errors";

/** Minimum fetch signature the SDK requires. Native `fetch` satisfies this. */
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface HttpContext {
  baseUrl: string;
  fetch: FetchLike;
  defaultHeaders: Record<string, string>;
}

/**
 * Perform a JSON request against the API and unwrap the body.
 *
 * Non-2xx responses raise `ApiClientError`; parse failures raise a plain
 * `Error` with the offending response status attached.
 */
export async function request<T>(
  ctx: HttpContext,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(path, ensureTrailingSlash(ctx.baseUrl));

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...ctx.defaultHeaders,
    ...options.headers,
  };

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };
  if (options.signal !== undefined) init.signal = options.signal;

  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    init.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const response = await ctx.fetch(url, init);

  if (!response.ok) {
    throw new ApiClientError(await extractProblemDetails(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new Error(
      `Failed to parse JSON response from ${url.toString()} (status ${response.status.toString()})`,
      { cause },
    );
  }
}

async function extractProblemDetails(response: Response): Promise<ProblemDetails> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // fall through to a synthetic problem below
  }

  if (isProblemDetails(payload)) {
    return { ...payload, status: payload.status || response.status };
  }

  return {
    type: `https://easyid.app/problems/http-${response.status.toString()}`,
    title: response.statusText || "HTTP Error",
    status: response.status,
    detail: response.statusText || "Request failed",
  };
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "title" in value &&
    "status" in value &&
    "detail" in value &&
    typeof (value as { type: unknown }).type === "string" &&
    typeof (value as { title: unknown }).title === "string" &&
    typeof (value as { status: unknown }).status === "number" &&
    typeof (value as { detail: unknown }).detail === "string"
  );
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}
