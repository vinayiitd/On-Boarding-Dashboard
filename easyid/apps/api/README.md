# apps/api

FastAPI service — the easyID compliance API.

## Architecture

Follows Clean Architecture. The **domain** is a pure Python package at
[`packages/domain`](../../packages/domain) (`easyid-domain`, import path
`easyid_domain`) — the single source of truth for entities and business
rules. The API is its sole runtime consumer (path dependency in
`pyproject.toml`). The web app never imports it; it talks to the domain
only through the HTTP contract in [`packages/types`](../../packages/types)
(`@easyid/types`). See
[`docs/adr/0003-domain-is-a-python-package.md`](../../docs/adr/0003-domain-is-a-python-package.md)
and
[`docs/adr/0004-bootstrap-tenancy-infrastructure-shape.md`](../../docs/adr/0004-bootstrap-tenancy-infrastructure-shape.md).

```
bootstrap/  ── wires the process (logging, lifespan, DI, contexts)
     │
api/  →  application/{commands,queries}  →  easyid_domain
              ↑
        infrastructure/
          ├── persistence/
          ├── messaging/
          ├── storage/
          ├── identity/
          └── observability/
```

| Layer            | Location                            | May import                                      |
| ---------------- | ----------------------------------- | ----------------------------------------------- |
| `bootstrap`      | `src/easyid_api/bootstrap/`         | config, infrastructure (composition only)       |
| `api`            | `src/easyid_api/api/`               | application, bootstrap contexts, infrastructure |
| `application`    | `src/easyid_api/application/`       | domain, ports, `TenantContext`                  |
| `infrastructure` | `src/easyid_api/infrastructure/`    | domain, ports                                   |
| `domain`         | `packages/domain` (`easyid_domain`) | (nothing framework-specific)                    |

"Contracts" = the shared HTTP wire types in `@easyid/types`, mirrored in
Python as Pydantic models under `api/v1/`.

### Multi-tenancy

The API resolves the tenant **once** per request (`TenantContextDep` in
`api/deps.py`). Every tenant-scoped command / query takes a
`TenantContext` as its first argument. Handlers never re-resolve or trust
a raw client tenant id.

Rules:

- No `from sqlalchemy import ...` inside `application/`, `bootstrap/`, or
  `easyid_domain`.
- No `from fastapi import ...` inside `application/` or `easyid_domain`.
- No Pydantic entity modelling inside `easyid_domain` — Pydantic belongs at
  the HTTP boundary.
- No `from easyid_api.api ...` inside `application/`, `bootstrap/`, or
  `infrastructure/`.
- Domain entities and pure business rules live in `packages/domain`, **not**
  inside `apps/api/`.
- `bootstrap/` contains no business logic — only composition.

CI enforces these boundaries with an import-linter pass (arriving in a follow-up
iteration).

## Stack

- **Python 3.13** managed with **uv**.
- **FastAPI** for HTTP.
- **SQLAlchemy 2.x async** + `asyncpg` driver.
- **Alembic** for migrations (async env).
- **pydantic-settings** for typed env-var config.
- **Ruff** for lint + format.
- **mypy** for type checking (strict).
- **pytest + pytest-asyncio + httpx** for tests.

## Local setup

```bash
# From apps/api/
uv sync --dev
cp .env.example .env
uv run alembic upgrade head        # currently a no-op — no migrations yet
uv run uvicorn easyid_api.main:app --reload
```

Then visit:

- **API**: <http://localhost:8000/api/v1/health>
- **Swagger**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>
- **OpenAPI JSON**: <http://localhost:8000/openapi.json>

## Common tasks

```bash
uv run pytest                       # tests
uv run ruff check .                 # lint
uv run ruff format .                # format
uv run mypy                         # type check

# Migrations
uv run alembic revision --autogenerate -m "add users table"
uv run alembic upgrade head
uv run alembic downgrade -1
```

## Docker

Build context is the monorepo root (so the `packages/domain` path
dependency resolves):

```bash
# From easyid/
docker build -t easyid/api -f apps/api/Dockerfile .
docker run --rm -p 8000:8000 --env-file apps/api/.env easyid/api
```

Or via Compose: `pnpm docker:up`. The image runs as a non-root user and
ships with a healthcheck against `/api/v1/health`.
