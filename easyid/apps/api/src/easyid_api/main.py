"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from easyid_api import __version__
from easyid_api.api.errors import register_exception_handlers
from easyid_api.api.v1.router import router as v1_router
from easyid_api.bootstrap.lifespan import build_lifespan
from easyid_api.bootstrap.middleware import RequestContextMiddleware
from easyid_api.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    """Compose the FastAPI application.

    Kept as a factory so tests can construct a fresh instance with overridden
    settings without touching module-level globals. Wiring (logging, DI
    container, engine lifecycle) lives in `bootstrap/` — this function only
    assembles the HTTP surface.
    """
    cfg = settings or get_settings()

    app = FastAPI(
        title="easyID API",
        description=(
            "Compliance platform for regulated Australian businesses. "
            "This service exposes the core domain via a versioned REST API."
        ),
        version=__version__,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=build_lifespan(cfg),
    )

    # Starlette applies middleware in reverse add-order; RequestContext
    # should wrap the request innermost relative to CORS so every handler
    # (and error path) sees a bound context.
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(v1_router, prefix="/api")

    return app


# Default ASGI entrypoint used by `uvicorn easyid_api.main:app`.
app = create_app()
