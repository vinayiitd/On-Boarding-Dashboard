# apps/api

FastAPI service — the easyID compliance API.

## Scope

**FND-002** — application bootstrap (factory, routing, settings, logging,
lifespan, RFC 7807, request correlation, composition root).

**FND-003** — persistence foundation:

- SQLAlchemy 2.x async engine + asyncpg
- Alembic with explicit MetaData naming conventions
- Async session factory + Unit of Work
- Repository base (application port + infrastructure impl)
- `infrastructure/persistence/mappings/` (no business tables yet)
- Database health probe wired into `GET /api/v1/health`
- UUID generation seam prepared for UUIDv7
- Optimistic locking mixin (`VersionedMixin`)

No business entities (Organisation, Party, User, etc.) and no ORM types in
`packages/domain`.

## Architecture

```
bootstrap/       ── wires the process (logging, lifespan, DI)
api/             ── HTTP surface (routers, deps, RFC 7807 errors)
application/     ── use cases + ports (UnitOfWork, repositories, health)
infrastructure/  ── adapters (persistence/, …)
```

Domain entities live in [`packages/domain`](../../packages/domain)
(`easyid_domain`). The API depends on that package via a uv path source.

## Stack

- **Python 3.13** managed with **uv**
- **FastAPI** for HTTP
- **SQLAlchemy 2.x async** + **asyncpg** + **Alembic**
- **Pydantic Settings v2** for typed env-var config
- **Ruff** for lint + format
- **mypy** for type checking (strict)
- **pytest + pytest-asyncio + httpx** for tests

## Local setup

```bash
# Start Postgres (from easyid/)
docker compose up -d postgres

# From apps/api/
uv sync --dev
cp .env.example .env
uv run uvicorn easyid_api.main:app --reload
```

Then visit:

- **API**: <http://localhost:8000/api/v1/health>
- **Swagger**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>
- **OpenAPI JSON**: <http://localhost:8000/openapi.json>

## Migrations

```bash
# From apps/api/
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run alembic downgrade -1
```

Autogenerate reads mappings imported from
`easyid_api.infrastructure.persistence.mappings`.

## Common tasks

```bash
uv run pytest
uv run ruff check .
uv run ruff format .
uv run mypy
```

## Docker

Build context is the monorepo root (so the `packages/domain` path dependency
resolves):

```bash
# From easyid/
docker compose up -d
```
