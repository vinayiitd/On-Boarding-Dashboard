"""FastAPI application factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from easyid_api import __version__
from easyid_api.api.errors import register_exception_handlers
from easyid_api.api.v1.router import router as v1_router
from easyid_api.config import Settings, get_settings
from easyid_api.infrastructure.db.engine import dispose_engine


def create_app(settings: Settings | None = None) -> FastAPI:
    """Compose the FastAPI application.

    Kept as a factory so tests can construct a fresh instance with overridden
    settings without touching module-level globals.
    """
    cfg = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        # Startup — extend later (warm caches, connect to queues, etc.).
        yield
        # Shutdown
        await dispose_engine()

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
        lifespan=lifespan,
    )

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
