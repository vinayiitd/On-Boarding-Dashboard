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

The domain layer is **shared** across the monorepo: it lives in
`packages/domain` (`@easyid/domain`) and is consumed by both the web app and
the API. The API keeps three local layers; entities and pure rules never
live inside the service.

```
                    ┌─────────────────────────────┐
                    │  packages/domain            │
                    │  @easyid/domain             │
                    │  entities + pure rules      │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
       apps/web/src/         apps/api                packages/*
                             ├── api/            ── HTTP surface. May depend on
                             │                     application, infrastructure,
                             │                     contracts.
                             ├── application/    ── Use cases. May depend on
                             │                     ports + contracts.
                             └── infrastructure/ ── Concrete adapters. May
                                                   depend on ports + contracts.
```

"Contracts" = the shared HTTP wire types in `@easyid/types` (mirrored in
Python as Pydantic models under `api/v1/`).

Enforced rules:

- **No entity or business rule inside `apps/api/`.** Domain modelling belongs
  in `@easyid/domain`. See
  [`docs/adr/0001-consolidate-domain-into-packages-domain.md`](./adr/0001-consolidate-domain-into-packages-domain.md).
- **No SQLAlchemy inside `application/`.** Persistence models live in
  `infrastructure/db/models/`.
- **No FastAPI inside `application/`.** Dependency injection types belong in
  `api/deps.py`.
- **No `api/` imports inside `application/` or `infrastructure/`.**

CI enforces these boundaries with an import-linter pass (arriving in a follow-up
iteration).

## Frontend architecture

`apps/web` and shared TS packages compose around the same domain model:

- **`@easyid/domain`** — entities and pure business rules. Framework
  independent. The single source of truth used by both web and API.
- **`@easyid/types`** — HTTP wire contracts (also consumed by the SDK and
  mirrored server-side).
- **`@easyid/sdk`** — the HTTP client. No React, no caching.
- **`@easyid/ui`** — design tokens + primitives.
- **`@easyid/common`** — cross-cutting utilities (assertions, guards, tiny
  helpers) that don't belong in any of the above.
- **`apps/web/src/`** — the app itself. Composes SDK + UI + domain. Uses
  TanStack Query for server state; RHF + Zod for forms.

## Read the code in this order

1. `apps/api/src/easyid_api/main.py` — how the FastAPI app is composed.
2. `apps/api/src/easyid_api/api/v1/health.py` — the reference endpoint.
3. `apps/api/src/easyid_api/infrastructure/db/` — engine + session wiring.
4. `apps/web/src/app/page.tsx` + `components/health-check.tsx` — the end-to-end
   call.
5. `packages/sdk/src/` — the client.
