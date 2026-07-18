# ADR-0003: The domain package is Python, not TypeScript

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** ADR-0001 (language / consumer model only — the
  consolidation into `packages/domain` still stands)
- **Superseded by:** —

## Context

[ADR-0001](./0001-consolidate-domain-into-packages-domain.md) correctly
collapsed two empty domain layers into a single package at
`packages/domain`. It also, incorrectly, framed that package as a
**TypeScript** workspace (`@easyid/domain`) shared by both the web app and
the API, with the API "mirroring" shapes via `@easyid/types`.

That framing conflicts with where the business domain actually executes:

- The backend is Python (FastAPI).
- The frontend is TypeScript (Next.js).
- Business rules, invariants, and entity behaviour run on the **backend**.
  The web app displays state and collects input; it does not own the
  domain.

Keeping the domain in TypeScript would mean either:

1. Reimplementing every invariant in Python (drift, double work), or
2. Trusting the client to enforce rules the server must then re-check
   anyway (security and correctness risk).

Neither is acceptable. The domain package must be the language the
backend runs.

## Decision

`packages/domain` is a **pure Python package** (`easyid-domain`, import
path `easyid_domain`), managed with uv/hatchling, with zero runtime
dependencies. It is consumed exclusively by `apps/api` via a path
dependency in `apps/api/pyproject.toml`.

The web app does **not** depend on the domain package. It consumes the
domain only through the HTTP wire contract in `@easyid/types` (mirrored
server-side as Pydantic models under `apps/api/src/easyid_api/api/v1/`).

The TypeScript package `@easyid/domain` is removed. Cross-cutting
TypeScript helpers that are not domain rules continue to live in
`@easyid/common` (see [ADR-0002](./0002-introduce-packages-common.md)).

## Options considered

1. **Keep `@easyid/domain` as TypeScript, generate Python mirrors.**
   - Pros: Web can import entities directly for client-side validation UX.
   - Cons: The source of truth for business rules would sit in a language
     the server does not execute. Generation adds tooling; any rule that
     cannot be expressed as a type still has to be rewritten in Python.
2. **Domain as a Python package (chosen).**
   - Pros: Rules execute where they must. One source of truth. Clean
     Clean Architecture on the API. Web stays thin and contract-driven.
   - Cons: Client-side UX validation cannot reuse domain functions
     directly — it must re-express constraints in Zod (or similar) at
     the form boundary. Acceptable: UX validation is a subset of domain
     validation, not a second domain.
3. **Domain inside `apps/api/src/easyid_api/domain/` again.**
   - Pros: Simpler packaging (no path dependency, no Docker context
     change).
   - Cons: Walks back ADR-0001's consolidation. Makes the domain harder
     to test and reuse if we ever add a second Python consumer (worker,
     CLI, second service). The package boundary is cheap and worth
     keeping.

## Consequences

- **Positive:**
  - Business rules execute in the language of the backend.
  - `apps/api` imports `easyid_domain` directly — no mirroring tax for
    behaviour, only for HTTP wire shapes.
  - The web tier cannot accidentally take a dependency on domain
    internals.
- **Negative / trade-offs:**
  - Client-side form validation (Zod) is a separate, thinner concern —
    intentionally. Do not try to share Zod schemas with the domain.
  - Docker build context for the API moves from `apps/api/` to the
    monorepo root so the path dependency can be resolved.
  - pnpm no longer knows about `packages/domain` (no `package.json`).
    Python tooling (uv) owns that package entirely.
- **Follow-ups:**
  - When the first entity lands, add an import-linter rule forbidding
    FastAPI / SQLAlchemy / Pydantic imports inside `easyid_domain`.
  - Consider a small OpenAPI → `@easyid/types` generation step so wire
    shapes stay in sync automatically.
- **Reversibility:**
  - Cheap while the package is empty. Cost grows with every entity
    added.

## References

- [`packages/domain/README.md`](../../packages/domain/README.md)
- [ADR-0001](./0001-consolidate-domain-into-packages-domain.md) —
  consolidation into `packages/domain` (still stands; language model
  superseded by this ADR).
- [`docs/architecture.md`](../architecture.md)
