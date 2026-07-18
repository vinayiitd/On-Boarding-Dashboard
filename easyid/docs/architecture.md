# Architecture

easyID is a **modular monolith** with a strict, one-directional layered
architecture. The goal is to ship features fast without accumulating the
integration debt of a microservice fleet, while keeping the option to split
services out later when a bounded context genuinely needs its own deploy.

## Style

- **API-first.** Every capability is defined by an OpenAPI contract before any
  UI or code is written.
- **Domain-Driven Design.** Bounded contexts (Customer, Identity, Review,
  Reporting, etc.) shape the module boundaries under `apps/api/src/easyid_api/`.
- **Clean Architecture.** See below.
- **CQRS-lite.** Commands (writes) and queries (reads) live in separate
  application-layer modules. Full event sourcing is _not_ on the table for the
  foreseeable future — it's overkill for our current scale.
- **Repository Pattern** at the persistence boundary.
- **Dependency Injection** via FastAPI's `Depends`. No global singletons for
  business dependencies.

## Layered dependency direction

```
apps/api
├── api/            ── HTTP surface. May depend on application, domain, infra.
├── application/    ── Use cases. May depend on domain + ports.
├── domain/         ── Entities + rules. Depends on nothing framework-specific.
└── infrastructure/ ── Concrete adapters. May depend on domain + ports.
```

Enforced rules:

- **No SQLAlchemy inside `domain/`.** Persistence models live in
  `infrastructure/db/models/`.
- **No FastAPI inside `domain/` or `application/`.** Dependency injection types
  belong in `api/deps.py`.
- **No `api/` imports inside `application/`, `domain/`, `infrastructure/`.**

CI enforces these boundaries with an import-linter pass (arriving in a follow-up
iteration).

## Frontend architecture

`apps/web` follows the same discipline in TypeScript:

- **`@easyid/domain`** — entities and rules for the client tier, framework
  independent.
- **`@easyid/sdk`** — the HTTP client. No React, no caching.
- **`@easyid/ui`** — design tokens + primitives.
- **`@easyid/types`** — shared contract types (also consumed by the SDK).
- **`apps/web/src/`** — the app itself. Composes SDK + UI. Uses TanStack Query
  for server state; RHF + Zod for forms.

## Read the code in this order

1. `apps/api/src/easyid_api/main.py` — how the FastAPI app is composed.
2. `apps/api/src/easyid_api/api/v1/health.py` — the reference endpoint.
3. `apps/api/src/easyid_api/infrastructure/db/` — engine + session wiring.
4. `apps/web/src/app/page.tsx` + `components/health-check.tsx` — the end-to-end
   call.
5. `packages/sdk/src/` — the client.
