<div align="center">

# easyID

**Compliance Matters.**

Production foundation for a modern SaaS compliance platform for regulated
Australian businesses.

</div>

---

## Overview

This repository holds the production codebase for easyID. It is deliberately
scoped to the **engineering foundation** in this initial iteration —
scaffolding, tooling, containers, CI, and a single reference endpoint end to
end. Business features (customer entities, identity capture, review workflow,
compliance reports, AI) are delivered in subsequent iterations.

## Architecture

- **Modular monolith** — one API service, one web app, one Postgres.
- **API-first**, versioned at `/api/v1/…`. OpenAPI available at `/openapi.json`.
- **Domain-Driven Design + Clean Architecture.** The domain layer is a
  **pure Python package** at `packages/domain` (`easyid-domain` /
  `easyid_domain`), consumed exclusively by `apps/api`. The web app never
  imports it — it talks to the domain through the HTTP contract in
  `@easyid/types`. See
  [`docs/architecture.md`](docs/architecture.md),
  [ADR-0001](docs/adr/0001-consolidate-domain-into-packages-domain.md),
  [ADR-0003](docs/adr/0003-domain-is-a-python-package.md).
- **CQRS-lite** — commands and queries kept separate in the application layer.
- **Repository Pattern** at the persistence boundary.
- **Dependency Injection** via FastAPI's `Depends`.

Shared packages: `easyid-domain` (Python — entities + rules),
`@easyid/types` (TS wire contracts), `@easyid/sdk` (TS HTTP client),
`@easyid/ui` (TS design system), `@easyid/common` (TS cross-cutting
utilities), `@easyid/config` (TS + ESLint presets).

## Tech stack

| Layer          | Choice                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query · RHF · Zod |
| **Backend**    | FastAPI · Python 3.13 · uv · Pydantic Settings v2                                             |
| **Errors**     | RFC 7807 Problem Details                                                                      |
| **Monorepo**   | pnpm workspaces · Turborepo                                                                   |
| **Containers** | Docker Compose                                                                                |
| **CI**         | GitHub Actions (Node · Python · Docker)                                                       |
| **Testing**    | Pytest · Vitest · Playwright                                                                  |
| **Tooling**    | ESLint · Prettier · Ruff · mypy · Husky · lint-staged · EditorConfig                          |

Persistence foundation (FND-003): SQLAlchemy 2.x async + asyncpg + Alembic.
No business mappings yet.

## Folder structure

```
easyid/
├── apps/
│   ├── api/                    # FastAPI API — consumes packages/domain
│   │   ├── src/easyid_api/
│   │   │   ├── api/            # HTTP surface (routers, RFC 7807 errors)
│   │   │   ├── application/    # Use cases + ports (UoW, repositories, health)
│   │   │   ├── bootstrap/      # logging, lifespan, DI, request context
│   │   │   └── infrastructure/ # persistence/ + adapter stubs
│   │   ├── alembic/            # Deterministic migrations
│   │   ├── tests/              # Pytest + httpx
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   └── web/                    # Next.js 15 + React 19 (never imports the domain)
│       ├── src/
│       │   ├── app/            # App Router + Providers (TanStack Query)
│       │   ├── components/     # Screen-specific components
│       │   ├── lib/            # SDK instance, utilities
│       │   └── env.ts          # Typed env access
│       ├── e2e/                # Playwright tests
│       ├── Dockerfile
│       └── package.json
├── packages/
│   ├── common/                 # TS cross-cutting utilities (assertions, guards, tiny helpers)
│   ├── config/                 # Shared TS + ESLint configs
│   ├── domain/                 # Python domain layer — entities + rules (API only)
│   ├── sdk/                    # Typed HTTP client for the API
│   ├── types/                  # Shared wire contract types
│   └── ui/                     # Design tokens + primitives
├── infrastructure/
│   └── docker/                 # Postgres init SQL + supporting docker config
├── docs/                       # architecture, getting-started, development, deployment, contributing
│   └── adr/                    # Architecture Decision Records
├── .github/
│   ├── workflows/ci.yml
│   ├── dependabot.yml
│   └── pull_request_template.md
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md   ← you are here
```

## Setup

Full instructions in [`docs/getting-started.md`](docs/getting-started.md). Quick
start:

```bash
# 1. Clone + install
git clone <repo> && cd easyid
cp .env.example .env
pnpm install

# 2. Bring everything up
pnpm docker:up
```

Then:

- Web: <http://localhost:3000>
- API health: <http://localhost:8000/api/v1/health>
- Swagger: <http://localhost:8000/docs>

## Commands

Run from the workspace root:

```bash
pnpm dev              # every workspace's dev command, in parallel
pnpm build            # turbo-cached build of every workspace
pnpm lint             # ESLint across TS packages
pnpm typecheck        # tsc --noEmit everywhere
pnpm test             # unit tests (Vitest, Pytest via turbo)
pnpm test:e2e         # Playwright against apps/web
pnpm format           # prettier
pnpm docker:up        # start postgres, api, web
pnpm docker:down      # stop them
pnpm docker:reset     # nuke volumes and rebuild
```

API-specific (from `apps/api/`):

```bash
uv sync --dev
uv run uvicorn easyid_api.main:app --reload
uv run pytest
uv run ruff check .
uv run mypy
```

## Development workflow

See [`docs/development.md`](docs/development.md) for branches, commits, adding
endpoints, and adding packages. Layer boundaries and review rules are in
[`docs/contributing.md`](docs/contributing.md).

## Reference endpoint

The stack ships with a single endpoint used to smoke-test the whole chain:

```
GET /api/v1/health  →  { "status": "healthy", "version": "0.1.0" }
```

The web app fetches it via `@easyid/sdk` and displays the status on the home
page. If the pill is green, the end-to-end wiring is intact.

## What is deliberately **not** here

Per the bootstrap brief, this iteration ships only the engineering foundation.
The following are **explicitly excluded** and will land in subsequent
iterations:

- Business entities (Customer / Party / Client / etc.)
- Authentication and authorisation
- Tenant resolution
- AI / LLM integration
- Business use cases in the application layer

Adding any of the above before their own iteration is a code-review veto.

## Licence

Proprietary — © easyID. Not for external distribution.
