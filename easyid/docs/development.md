# Development workflow

## Branches & PRs

- Branch from `main`. Naming: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`, or
  `docs/<slug>`.
- One PR = one logical change. Small PRs merge fast.
- Every PR must go green on CI before merge.
- Squash-merge into `main`. The squash message becomes the semantic commit.

## Commit style

Follow Conventional Commits at the PR/squash level:

```
feat(api): add /api/v1/reviews endpoint
fix(web): correct hydration order in providers
docs: describe Clean Architecture boundaries
chore(deps): bump next to 15.1.5
refactor(sdk): split http client into transport + endpoints
```

Individual commits within a branch can be scrappy — the squash message is what
lives on `main`.

## Common commands

Root:

```bash
pnpm install        # install all workspaces
pnpm dev            # run every workspace's dev command in parallel
pnpm build          # turbo-cached build of every workspace
pnpm lint           # eslint everywhere
pnpm typecheck      # tsc --noEmit everywhere
pnpm test           # unit tests everywhere
pnpm test:e2e       # Playwright on apps/web
pnpm format         # prettier
pnpm docker:up      # start postgres, api, web
```

Web only:

```bash
pnpm --filter @easyid/web dev
pnpm --filter @easyid/web test
pnpm --filter @easyid/web test:e2e
```

API only:

```bash
cd apps/api
uv run uvicorn easyid_api.main:app --reload
uv run pytest
uv run ruff check .
uv run mypy
```

## Adding a TypeScript package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`,
   `eslint.config.mjs`.
2. Use `"name": "@easyid/<name>"` and `"private": true`.
3. Depend on `@easyid/config` for TS + ESLint presets.
4. `pnpm install` from the repo root — pnpm links it into every consumer
   automatically.
5. If the new package changes a layer boundary or a public contract, add
   an ADR in [`docs/adr/`](./adr/README.md). Copy
   [`docs/adr/template.md`](./adr/template.md) and increment the number.

## Adding a Python package

1. Create `packages/<name>/` with `pyproject.toml` (hatchling),
   `src/<import_name>/`, and `tests/`. Mirror `packages/domain` as the
   template.
2. Use `"name": "easyid-<name>"` and `requires-python = ">=3.13,<3.14"`.
3. Wire consumers via a `[tool.uv.sources]` path dependency (see
   `apps/api/pyproject.toml` → `easyid-domain`).
4. Run `uv lock` in both the new package and every consumer.
5. If the package changes a layer boundary, add an ADR.

> The domain package (`packages/domain`) is Python on purpose — see
> [ADR-0003](./adr/0003-domain-is-a-python-package.md). Do not reintroduce
> a TypeScript `@easyid/domain`.

## Architecture Decision Records

Architectural decisions — layer boundaries, package boundaries, framework
choices, dependency additions — are recorded as ADRs in
[`docs/adr/`](./adr/README.md). Read them before proposing changes to any
of the above, and add one when you make a change that a future contributor
might reasonably want to revisit.

## Adding an API endpoint

1. Create a router module under `apps/api/src/easyid_api/api/v1/`.
2. Register it in `api/v1/router.py`.
3. Define request / response shapes as Pydantic models in the same file.
4. Put use-case logic in `application/` (not in the router).
5. Add a `pytest` covering the happy path and one failure mode.
6. If the response shape is consumed by the web app, mirror the type in
   `@easyid/types` and expose an endpoint helper in `@easyid/sdk`.
7. Errors must surface as RFC 7807 Problem Details — raise `HTTPException`
   or let validation fail; do not invent ad-hoc error JSON.
