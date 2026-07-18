# Getting started

## Prerequisites

- **Node.js 20+** ([nvm](https://github.com/nvm-sh/nvm) recommended, obeys
  `.nvmrc`)
- **pnpm 10+** (`corepack enable && corepack use pnpm@10.4.0`)
- **Python 3.13** (via [uv](https://github.com/astral-sh/uv))
- **uv 0.5+** (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Docker + Docker Compose** (Docker Desktop or an equivalent)

## Fastest path — Docker

```bash
cd easyid
cp .env.example .env
pnpm docker:up
```

Then:

- Web: <http://localhost:3000>
- API: <http://localhost:8000/api/v1/health>
- Swagger: <http://localhost:8000/docs>

Stop with `pnpm docker:down`. Reset (drops Postgres data) with
`pnpm docker:reset`.

## Local dev (no Docker for the apps)

### Postgres

Either use `docker compose up -d postgres`, or connect to your own instance and
update `DATABASE_URL` accordingly.

### API

```bash
cd easyid/apps/api
uv sync --dev
cp .env.example .env
uv run alembic upgrade head          # no-op today, populates schema in the future
uv run uvicorn easyid_api.main:app --reload
```

### Web

```bash
cd easyid
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm --filter @easyid/web dev
```

Open <http://localhost:3000> — the healthcheck card on the home page should flip
to green.
