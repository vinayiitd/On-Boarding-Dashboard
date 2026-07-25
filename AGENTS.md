# Workspace

This repo is a multi-project workspace. See `README.md` for the product overview.

- `kyc-platform/` — **Sentinel**, the flagship product: a self-contained Next.js 16 KYC demo (no backend, no DB). This is the primary runnable application.
- `easyid/` — the **easyID** engineering-foundation monorepo (pnpm + Turborepo): FastAPI API (`apps/api`, Python 3.13 via `uv`) + Next.js 15 web (`apps/web`) + shared TS packages + a Python `packages/domain`. Backed by Postgres.
- `easyid.html`, `index.html`, `itinerary.html` — standalone static HTML pages; open directly in a browser (no build). `easyID/` is an empty placeholder dir.

Standard commands live in each project's `README.md` / `package.json` / `easyid/docs/`. Only the non-obvious, cloud-specific caveats are recorded below.

## Cursor Cloud specific instructions

The startup update script already refreshes all dependencies: `pnpm -C easyid install`, `npm install --prefix kyc-platform`, and `uv sync --dev` for `easyid/apps/api` and `easyid/packages/domain`. System-level tools (`uv` at `~/.local/bin/uv`, Python 3.13 managed by uv, and PostgreSQL 16) are baked into the VM snapshot — do not reinstall them.

### Ports used during setup
- `3000` easyID web (`apps/web`), `3100` Sentinel (`kyc-platform`), `8000` easyID API, `8080` static HTML server. Sentinel's `next dev` defaults to `3000`, so run it with `PORT=3100 npm run dev` when the easyID web app also needs `3000`.

### Postgres (needed only for the easyID API)
- Postgres is NOT auto-started on a fresh VM. Start the cluster with `sudo pg_ctlcluster 16 main start` (check with `sudo pg_lsclusters`).
- The `easyid` role/database (password `easyid`), the `pgcrypto`/`citext` extensions, and the baseline Alembic migration are already provisioned in the persisted data dir — no need to recreate them. Connection string: `postgresql+asyncpg://easyid:easyid@127.0.0.1:5432/easyid`.
- The API **starts fine without Postgres** (the DB engine is lazy); `GET /api/v1/health` returns HTTP 200 with `"database":"down"` and `"status":"degraded"` until Postgres is up. Most `apps/api` pytest tests expect a live DB, so start Postgres before running them.

### Running the services (dev mode)
- Sentinel: `cd kyc-platform && npm run dev` (self-contained; no API/DB required).
- easyID API: `cd easyid/apps/api && uv run uvicorn easyid_api.main:app --reload` (needs a `.env`; copy from `.env.example`). Swagger at `/docs`, health at `/api/v1/health`.
- easyID web: `pnpm -C easyid --filter @easyid/web dev` (reads `NEXT_PUBLIC_API_URL`, default `http://localhost:8000`). `pnpm -C easyid dev` runs the web app only (API is not a Turbo task).

### Known blocker — easyID web app + `@easyid/ui` do not build (pre-existing, not an env issue)
- `easyid/.gitignore` line 42 has a broad `lib/` rule that caused required source files to never be committed:
  - `easyid/apps/web/src/lib/api.ts` (imported by `apps/web/src/components/health-check.tsx`)
  - `easyid/packages/ui/src/lib/utils.ts` (the `cn` helper, imported across `@easyid/ui`)
- Effect: `easyid` `pnpm dev` (web) throws `Module not found: @/lib/api` (HTTP 500), and `pnpm typecheck` / `pnpm build` fail on the missing `@easyid/ui` `lib/utils` module. `pnpm lint` and the Python side are unaffected.
- Fix belongs to the repo owners: commit the missing `lib/` files and narrow the `.gitignore` `lib/` rule (e.g. anchor it to `/lib/` or `dist/lib/`). Do not work around it by inventing source in an env-setup pass.

### Green toolchain baselines (verified during setup)
- `easyid/apps/api`: `uv run ruff check .`, `uv run mypy`, `uv run pytest` (63 pass).
- `easyid/packages/domain`: `uv run pytest` (65 pass), `uv run ruff check .`.
- `easyid` root: `pnpm lint` passes all 6 workspaces (`pnpm typecheck`/`pnpm build` fail only due to the missing-`lib/` blocker above).
- `kyc-platform`: `npm run lint` (passes; 1 non-blocking React-Compiler warning) and `npm run build` (11 routes) succeed.
