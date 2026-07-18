# apps/api

FastAPI service — the easyID compliance API.

## Architecture

Follows Clean Architecture. Dependency direction is one-way:

```
api  →  application  →  domain  ←  infrastructure
```

| Layer            | Location                         | May import                          |
| ---------------- | -------------------------------- | ----------------------------------- |
| `api`            | `src/easyid_api/api/`            | application, domain, infrastructure |
| `application`    | `src/easyid_api/application/`    | domain, ports                       |
| `domain`         | `src/easyid_api/domain/`         | (nothing framework-specific)        |
| `infrastructure` | `src/easyid_api/infrastructure/` | domain, ports                       |

Rules:

- No `from sqlalchemy import ...` inside `domain/`.
- No `from fastapi import ...` inside `domain/` or `application/`.
- No `from easyid_api.api ...` inside `application/`, `domain/`, or
  `infrastructure/`.

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

```bash
docker build -t easyid/api -f Dockerfile .
docker run --rm -p 8000:8000 --env-file .env easyid/api
```

The image runs as a non-root user and ships with a healthcheck against
`/api/v1/health`.
