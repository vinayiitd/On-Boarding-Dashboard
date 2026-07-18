# apps/api

FastAPI service — the easyID compliance API.

## FND-002 scope

This foundation ships the **application bootstrap only**:

- FastAPI application factory
- Versioned routing at `/api/v1`
- Health endpoint
- Pydantic Settings v2 configuration
- Structured logging (stdlib)
- Lifespan startup / shutdown
- RFC 7807 Problem Details exception handling
- Request ID + Correlation ID middleware
- Lightweight composition root (`bootstrap/container.py`)
- OpenAPI metadata

It does **not** include persistence, authentication, authorization, tenant
resolution, SQLAlchemy, Alembic, PostgreSQL connectivity, or business logic.

## Architecture

```
bootstrap/  ── wires the process (logging, lifespan, DI)
api/        ── HTTP surface (routers, deps, RFC 7807 errors)
application/── use cases (empty in FND-002; may depend on domain)
infrastructure/── adapters (empty in FND-002)
```

Domain entities live in [`packages/domain`](../../packages/domain)
(`easyid_domain`). The API depends on that package via a uv path source.

## Stack

- **Python 3.13** managed with **uv**
- **FastAPI** for HTTP
- **Pydantic Settings v2** for typed env-var config
- **Ruff** for lint + format
- **mypy** for type checking (strict)
- **pytest + pytest-asyncio + httpx** for tests

## Local setup

```bash
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
docker build -t easyid/api -f apps/api/Dockerfile .
docker run --rm -p 8000:8000 --env-file apps/api/.env easyid/api
```

Or via Compose: `pnpm docker:up`.
