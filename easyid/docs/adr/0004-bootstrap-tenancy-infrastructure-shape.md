# ADR-0004: Bootstrap layer, infrastructure adapters, and TenantContext

- **Status:** Superseded by [ADR-0005](./0005-fnd-002-bootstrap-without-persistence-tenancy.md)
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** —
- **Superseded by:** [ADR-0005](./0005-fnd-002-bootstrap-without-persistence-tenancy.md)
- **Related:** [ADR-0003](./0003-domain-is-a-python-package.md) (domain is Python)

> **Note:** The bootstrap package and infrastructure adapter folders from
> this ADR remain. Early `TenantContext` wiring and `infrastructure/persistence/`
> were removed under FND-002 — see ADR-0005.

## Context

The API bootstrap iteration left three structural gaps:

1. **Composition lived inside `main.py`.** Lifespan, logging, and DI wiring
   were inline in the application factory. That file should assemble the
   HTTP surface, not own process lifecycle.
2. **Infrastructure was persistence-shaped.** Everything sat under
   `infrastructure/db/`, which does not leave an obvious home for
   messaging, object storage, identity providers, or telemetry exporters.
3. **Multi-tenancy had no seam.** There was no type, no dependency, and no
   convention for carrying a tenant into application services — even
   though the product is multi-tenant and isolation is non-negotiable.

We need these seams in place **before** the first real business use case
lands, so every handler is born tenant-scoped rather than retrofitted.

## Decision

### 1. Introduce a `bootstrap/` package

`apps/api/src/easyid_api/bootstrap/` owns process wiring and contains no
business logic:

| Module | Responsibility |
| ------ | -------------- |
| `logging.py` | Process-wide structlog configuration |
| `lifespan.py` | FastAPI startup / shutdown |
| `container.py` | DI composition root (ports → adapters) |
| `middleware.py` | Request-correlation logging middleware |
| `request_context.py` | Per-request `RequestContext` |
| `tenant_context.py` | Per-request `TenantContext` |

### 2. Grow infrastructure by adapter kind

```
infrastructure/
├── persistence/     # was db/ — SQLAlchemy engine, sessions, ORM, repos
├── messaging/       # queues / event buses (stub)
├── storage/         # object / file storage (stub)
├── identity/        # IdPs, JWKS, token validators (stub)
└── observability/   # metrics / tracing exporters (stub)
```

Process logging stays in `bootstrap/` (it configures the process; it is
not an external adapter). Outbound telemetry sinks land in
`observability/` when they appear.

### 3. TenantContext flows API → application

- The API resolves the tenant **once** per request in `api/deps.py`
  (`TenantContextDep`).
- Every tenant-scoped command / query handler takes `TenantContext` as its
  **first positional argument**.
- Handlers never re-resolve the tenant and never trust a raw client
  tenant id outside of `TenantContext`.
- Application use cases live under `application/commands/` and
  `application/queries/` (CQRS-lite).

Scaffold resolution today reads `X-Tenant-ID`. When
`infrastructure/identity/` lands, the same dependency will derive the
tenant from the authenticated principal instead of trusting the header.

Isolation strategy: **shared schema, row-level** — every persistence
query that touches tenant data filters on `tenant.tenant_id`.

## Options considered

1. **Keep wiring in `main.py`; add tenant later.**
   - Pros: Less structure now.
   - Cons: First use case will invent an ad-hoc tenant pattern; composition
     root keeps growing inside the HTTP factory.
2. **Middleware-only tenancy (implicit contextvar).**
   - Pros: Handlers stay "clean" of a tenant argument.
   - Cons: Hidden ambient state. Easy to forget in background jobs / tests.
     Explicit `TenantContext` arguments make the isolation contract
     visible and enforceable.
3. **Bootstrap + explicit TenantContext + adapter folders (chosen).**
   - Pros: Clear homes, explicit isolation, room to grow without reshuffles.
   - Cons: A few more empty packages today.

## Consequences

- **Positive:** Every future handler is born tenant-scoped. Infrastructure
  has an obvious shelf for each adapter kind. `main.py` stays a thin
  assembler.
- **Negative / trade-offs:** `X-Tenant-ID` is trusted until identity
  lands — acceptable only as a scaffold, called out in `api/deps.py`.
  Empty adapter packages add a little navigation noise.
- **Follow-ups:**
  - Replace header-based tenant resolution with principal-derived
    resolution once `infrastructure/identity/` has a real adapter.
  - Add an import-linter rule forbidding `application/` from importing
    `bootstrap.middleware` / FastAPI types.
  - Add a persistence helper that requires `TenantContext` on every
    tenant-scoped query.
- **Reversibility:** Cheap while handlers are empty. Cost grows with every
  use case that takes `TenantContext`.

## References

- [`apps/api/src/easyid_api/bootstrap/`](../../apps/api/src/easyid_api/bootstrap/)
- [`apps/api/src/easyid_api/api/deps.py`](../../apps/api/src/easyid_api/api/deps.py)
- [`docs/architecture.md`](../architecture.md)
