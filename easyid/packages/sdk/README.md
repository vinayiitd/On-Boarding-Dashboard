# @easyid/sdk

Typed HTTP client for the easyID API.

Kept intentionally thin: no auth, no retries, no caching. Higher-level concerns
belong to the consumer (e.g. TanStack Query in `apps/web`).

## Usage

```ts
import { createClient, ApiClientError } from "@easyid/sdk";

const api = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

try {
  const health = await api.health.get();
  console.log(health); // { status: "healthy", version: "0.1.0" }
} catch (e) {
  if (e instanceof ApiClientError) {
    console.error(e.code, e.message);
  } else {
    throw e;
  }
}
```

## Design

- **Stateless**. `createClient` returns a plain object of endpoint namespaces.
  No hidden singletons — instantiate once and reuse.
- **Injectable `fetch`**. Native `fetch` by default; pass a custom
  implementation for testing or Node < 20.
- **Discriminated errors**. Non-2xx responses raise `ApiClientError` carrying
  the server's `code`, `message`, `traceId`, and optional `details`.
- **AbortController-friendly**. Every endpoint accepts an `AbortSignal`.

## Adding endpoints

Add a file under `src/endpoints/`, export a function that takes an `HttpContext`
(already wired inside `createClient`), and expose it on the client shape in
`src/client.ts`.
