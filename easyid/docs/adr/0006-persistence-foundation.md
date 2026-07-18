# ADR-0006: Persistence foundation (SQLAlchemy async + PostgreSQL)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** easyID engineering
- **Supersedes:** — <!-- restores the deferred follow-up from ADR-0005 -->
- **Superseded by:** —
- **Related:** [ADR-0005](./0005-fnd-002-bootstrap-without-persistence-tenancy.md),
  [ADR-0004](./0004-bootstrap-tenancy-infrastructure-shape.md)

## Context

FND-002 / ADR-0005 deliberately shipped no persistence. FND-003 must add a
production-ready persistence foundation under Clean Architecture without
introducing business entities or leaking SQLAlchemy into the domain or
application layers.

## Decision

1. **SQLAlchemy 2.x async** with **asyncpg** against PostgreSQL.
2. Persistence adapters live under `infrastructure/persistence/`. ORM table
   classes live in `mappings/` (never a package named `models`).
3. Shared `MetaData` uses **explicit naming conventions** so Alembic
   autogenerate produces deterministic constraint names.
4. Application depends only on ports: `UnitOfWork`, `AbstractRepository`,
   `DatabaseHealth`. Infrastructure implements them; the composition root
   (`bootstrap/container.py`) wires them.
5. Entity IDs go through `generate_entity_id()` — UUID4 today, seam ready
   for UUIDv7.
6. `VersionedMixin` prepares optimistic locking via `version_id_col`.
7. No business mappings in this foundation (no Organisation, Party, User,
   Company, Trust, or KYC tables). Domain stays persistence-agnostic.

## Options considered

1. **Sync SQLAlchemy + psycopg.**
   - Pros: Simpler mental model.
   - Cons: Blocks the event loop; fights FastAPI's async stack.
2. **Raw asyncpg without SQLAlchemy.**
   - Pros: Thin.
   - Cons: No Alembic story, more hand-rolled SQL, weaker typing for mappings.
3. **SQLAlchemy 2.x async + asyncpg + Alembic (chosen).**
   - Pros: Fits Clean Architecture ports/adapters; deterministic migrations;
     async end-to-end.
   - Cons: Heavier dependency surface.

## Consequences

- **Positive:** Handlers can take `UnitOfWorkDep` without importing
  SQLAlchemy. Health probes report database readiness. Migrations are
  ready before the first business table.
- **Negative / trade-offs:** Empty `mappings/` until the first feature;
  UUID4 until UUIDv7 is adopted.
- **Follow-ups:** First business mapping + repository; UUIDv7 generator
  swap; tenant-scoped query helpers when tenancy returns.
- **Reversibility:** Medium — once mappings and migrations exist, changing
  the ORM is expensive.

## References

- [`apps/api/src/easyid_api/infrastructure/persistence/`](../../apps/api/src/easyid_api/infrastructure/persistence/)
- [`apps/api/alembic/`](../../apps/api/alembic/)
- [`apps/api/src/easyid_api/application/ports/`](../../apps/api/src/easyid_api/application/ports/)
