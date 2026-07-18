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

The domain layer is a **pure Python package** at `packages/domain`
(`easyid-domain`, import path `easyid_domain`). The business domain
executes on the backend, so the domain is written in the backend's
language. The API is the sole runtime consumer; the web app never imports
it. See
[`docs/adr/0003-domain-is-a-python-package.md`](./adr/0003-domain-is-a-python-package.md).

```
                    ┌─────────────────────────────┐
                    │  packages/domain            │
                    │  easyid_domain (Python)     │
                    │  entities + pure rules      │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                             apps/api
                             ├── api/            ── HTTP surface. May depend on
                             │                     application, infrastructure,
                             │                     domain, contracts.
                             ├── application/    ── Use cases. May depend on
                             │                     domain + ports.
                             └── infrastructure/ ── Concrete adapters. May
                                                   depend on domain + ports.

       apps/web  ──HTTP──▶  apps/api
           │
           └── depends on @easyid/types / @easyid/sdk / @easyid/ui /
               @easyid/common  (never on packages/domain)
```

"Contracts" = the shared HTTP wire types in `@easyid/types` (mirrored in
Python as Pydantic models under `api/v1/`).

Enforced rules:

- **No entity or business rule inside `apps/api/`.** Domain modelling belongs
  in `packages/domain` (`easyid_domain`). See
  [ADR-0001](./adr/0001-consolidate-domain-into-packages-domain.md) and
  [ADR-0003](./adr/0003-domain-is-a-python-package.md).
- **No FastAPI / SQLAlchemy / Pydantic inside `easyid_domain`.** The domain
  is framework-independent.
- **No FastAPI inside `application/`.** Dependency injection types belong in
  `api/deps.py`.
- **No `api/` imports inside `application/` or `infrastructure/`.**
- **No web-tier import of `easyid_domain`.** The browser talks to the domain
  only through HTTP.
- **`bootstrap/` contains no business logic** — only process wiring.
- **FND-002 ships no persistence.** Infrastructure adapters land in later
  foundations.

CI enforces these boundaries with an import-linter pass (arriving in a follow-up
iteration).

## API bootstrap (FND-002)

```
apps/api/src/easyid_api/
├── bootstrap/          # logging, lifespan, DI container, RequestContext
├── api/                # HTTP surface — RFC 7807 errors, /api/v1 routes
├── application/        # commands/ + queries/ shelves (empty in FND-002)
└── infrastructure/     # identity/messaging/storage/observability stubs
                        # (no persistence or tenancy in FND-002)
```

Errors use RFC 7807 Problem Details (`application/problem+json`). Every
response carries `X-Request-ID` and `X-Correlation-ID`. See
[ADR-0005](./adr/0005-fnd-002-bootstrap-without-persistence-tenancy.md).

## Frontend architecture

`apps/web` is a thin, contract-driven client. It does **not** own or import
the domain:

- **`@easyid/types`** — HTTP wire contracts (also consumed by the SDK and
  mirrored server-side as Pydantic models), including `ProblemDetails`.
- **`@easyid/sdk`** — the HTTP client. No React, no caching.
- **`@easyid/ui`** — design tokens + primitives.
- **`@easyid/common`** — cross-cutting TypeScript utilities (assertions,
  guards, tiny helpers).
- **`apps/web/src/`** — the app itself. Composes SDK + UI. Uses TanStack
  Query for server state; RHF + Zod for form UX validation (a thinner
  concern than domain validation — intentionally separate).

## Read the code in this order

1. `packages/domain/` — the Python domain package (empty today).
2. `apps/api/src/easyid_api/main.py` — how the FastAPI app is composed.
3. `apps/api/src/easyid_api/bootstrap/` — lifespan, logging, container, middleware.
4. `apps/api/src/easyid_api/api/v1/health.py` — the reference endpoint.
5. `apps/api/src/easyid_api/api/errors.py` — RFC 7807 handlers.
6. `apps/web/src/app/page.tsx` + `components/health-check.tsx` — the end-to-end
   call.
7. `packages/sdk/src/` — the client.
