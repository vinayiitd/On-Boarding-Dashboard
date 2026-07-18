# Deployment

Production deployment is intentionally not wired in this iteration — the
foundation ships production-ready containers and CI, but choosing hosts (Fly.io
/ Render / AWS / Vercel) is a separate decision.

## What is production-ready today

- Each app produces a self-contained Docker image sized for production
  (multi-stage build, non-root user, embedded healthcheck).
- The API image runs `uvicorn easyid_api.main:app` on port 8000 and exposes
  `/api/v1/health` for orchestrator probes.
- The web image uses Next.js `output: "standalone"` and runs
  `node apps/web/server.js` on port 3000.
- CI builds both images on every PR so a broken Dockerfile fails fast.

## Environment variables required in production

See `.env.example` for the authoritative list. Minimum:

- `DATABASE_URL` (must use `postgresql+asyncpg://`)
- `API_CORS_ORIGINS` (comma-separated, no `*` in prod)
- `NEXT_PUBLIC_API_URL` (public API URL, baked into the web bundle at build)

## What's coming next

- Alembic auto-migrate on API startup — behind an env flag so a rollback never
  runs `downgrade` unattended.
- OpenTelemetry wiring for both apps.
- Terraform / Pulumi module for the target cloud.
- Blue/green or canary deploy workflow in GitHub Actions.
