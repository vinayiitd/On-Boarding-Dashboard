# syntax=docker/dockerfile:1.7
# =============================================================================
# apps/api · production image
# Multi-stage build with uv. Build context is the easyid/ monorepo root so
# the path dependency on packages/domain can be resolved. Final image is a
# slim Python 3.13 with only the runtime venv copied in — no build tools
# shipped to production.
# =============================================================================

FROM ghcr.io/astral-sh/uv:0.5.14-python3.13-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /repo

# Domain package first — the API depends on it via a path source in
# pyproject.toml (`easyid-domain = { path = "../../packages/domain" }`).
COPY packages/domain ./packages/domain

# Install API deps for max layer cache reuse (project itself installed later).
COPY apps/api/pyproject.toml apps/api/uv.lock ./apps/api/
WORKDIR /repo/apps/api
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Now install the API project itself.
COPY apps/api .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ------------------------------------------------------------------
FROM python:3.13-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Non-root user
RUN groupadd --system --gid 1001 easyid \
 && useradd --system --uid 1001 --gid easyid --create-home --home-dir /home/easyid easyid

WORKDIR /app

COPY --from=builder --chown=easyid:easyid /opt/venv /opt/venv
COPY --from=builder --chown=easyid:easyid /repo/apps/api /app

USER easyid

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request,sys; \
      sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=3).status == 200 else 1)"

CMD ["uvicorn", "easyid_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
