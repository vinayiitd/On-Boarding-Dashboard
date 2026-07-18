# ADR-0005: FND-002 bootstrap without persistence or tenancy

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** [ADR-0004](./0004-bootstrap-tenancy-infrastructure-shape.md)
  (early `TenantContext` wiring and persistence adapters)
- **Superseded by:** —
- **Related:** [ADR-0003](./0003-domain-is-a-python-package.md)

## Context

ADR-0004 introduced a `bootstrap/` package, reshaped `infrastructure/` by
adapter kind, and wired an early `TenantContext` (header-based) plus
SQLAlchemy persistence scaffolding. That overlapped with foundation ticket
**FND-002**, which scopes a production-ready FastAPI bootstrap **only**:

- Clean Architecture layering
- Composition root, lifespan, structured logging, request correlation
- RFC 7807 error responses
- Versioned health route

and explicitly **forbids** persistence, SQLAlchemy, Alembic, Postgres
connectivity, authentication, tenant resolution, and business logic.

After ADR-0004 merged to `main`, FND-002 must rebase onto it and drop the
parts that violate that ticket while keeping the useful structural seams.

## Decision

1. **Keep** the `bootstrap/` package as the composition root
   (`logging`, `lifespan`, `container`, `middleware`, `request_context`,
   shared `ids.new_id()`).
2. **Keep** empty infrastructure shelves (`messaging/`, `storage/`,
   `identity/`, `observability/`) and CQRS-lite `application/commands/` +
   `application/queries/` packages as navigation seams.
3. **Remove** for FND-002:
   - `bootstrap/tenant_context.py` and `TenantContextDep`
   - `infrastructure/persistence/` (engine, session, ORM base)
   - Alembic / SQLAlchemy / asyncpg dependencies and DB settings
4. **Defer** multi-tenancy and persistence to later foundations. When they
   return, prefer the ADR-0004 direction: explicit `TenantContext` as the
   first handler argument, and row-level isolation in persistence — but do
   not ship header-trusted tenant resolution or a live DB before those
   foundations are ready.

## Options considered

1. **Keep ADR-0004 wiring under FND-002.**
   - Pros: Tenancy seam already present.
   - Cons: Violates FND-002 scope; trusts `X-Tenant-ID`; pulls persistence
     deps into a bootstrap-only milestone.
2. **Strip everything from ADR-0004, including adapter folders.**
   - Pros: Minimal tree.
   - Cons: Throws away cheap navigation seams already agreed.
3. **Keep structure, drop persistence/tenancy wiring (chosen).**
   - Pros: Matches FND-002; preserves shelves for later foundations.
   - Cons: Empty packages until the next tickets fill them.

## Consequences

- **Positive:** FND-002 stays reviewable and shippable without a database
  or auth story. Request correlation (`RequestContext` + `new_id()`) is the
  only per-request context in this foundation.
- **Negative / trade-offs:** Handlers are not yet born tenant-scoped; that
  must be reintroduced before the first multi-tenant use case.
- **Follow-ups:**
  - Reintroduce `TenantContext` with principal-derived resolution (not a
    raw client header) when identity lands.
  - Add `infrastructure/persistence/` with SQLAlchemy + Alembic in the
    persistence foundation.
- **Reversibility:** High — the seams remain; only early wiring was removed.

## References

- [`apps/api/src/easyid_api/bootstrap/`](../../apps/api/src/easyid_api/bootstrap/)
- [`apps/api/README.md`](../../apps/api/README.md)
- [`docs/architecture.md`](../architecture.md)
