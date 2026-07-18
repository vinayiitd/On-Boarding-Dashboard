import type { HttpContext, FetchLike } from "./http";
import { getHealth } from "./endpoints/health";

export interface ClientOptions {
  /**
   * Base URL of the API, e.g. `https://api.easyid.au` or
   * `http://localhost:8000`. May include or omit a trailing slash.
   */
  baseUrl: string;
  /**
   * Custom fetch implementation. Defaults to the global `fetch`.
   * Injected so callers can provide a mocked or instrumented fetch
   * (useful in Node <20, tests, or Next.js server components).
   */
  fetch?: FetchLike;
  /**
   * Default headers appended to every request.
   */
  headers?: Record<string, string>;
}

export interface EasyIdClient {
  health: {
    get: (init?: { signal?: AbortSignal }) => ReturnType<typeof getHealth>;
  };
}

/**
 * Build a client bound to a specific base URL. The client is intentionally
 * stateless — instantiate once per environment (`apps/web/src/lib/api.ts`)
 * and reuse.
 */
export function createClient(options: ClientOptions): EasyIdClient {
  const ctx: HttpContext = {
    baseUrl: options.baseUrl,
    fetch: options.fetch ?? globalFetch(),
    defaultHeaders: options.headers ?? {},
  };

  return {
    health: {
      get: (init) => getHealth(ctx, init ?? {}),
    },
  };
}

function globalFetch(): FetchLike {
  if (typeof fetch !== "function") {
    throw new Error("No global fetch available. Pass a `fetch` implementation to createClient().");
  }
  return fetch;
}
