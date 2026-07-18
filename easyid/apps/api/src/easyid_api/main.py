"""FastAPI application factory."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from easyid_api.api.errors import register_exception_handlers
from easyid_api.api.v1.router import router as v1_router
from easyid_api.bootstrap.container import build_container
from easyid_api.bootstrap.lifespan import build_lifespan
from easyid_api.bootstrap.middleware import RequestContextMiddleware
from easyid_api.config import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    """
    Compose the FastAPI application.

    Kept as a factory so tests can construct a fresh instance with explicit
    settings. Wiring (logging, composition root, middleware) lives in
    `bootstrap/` — this function only assembles the HTTP surface.
    """
    cfg = settings if settings is not None else Settings()
    container = build_container(cfg)

    app = FastAPI(
        title=cfg.app_name,
        version=cfg.app_version,
        summary="Compliance platform API for regulated Australian businesses.",
        description=(
            "easyID API exposes the platform over a versioned REST interface. "
            "Errors follow RFC 7807 Problem Details (`application/problem+json`)."
        ),
        contact={
            "name": cfg.openapi_contact_name,
            "email": cfg.openapi_contact_email,
        },
        license_info={"name": "Proprietary"},
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        root_path=cfg.api_root_path,
        lifespan=build_lifespan(cfg),
        openapi_tags=[
            {
                "name": "system",
                "description": "Operational endpoints (health).",
            },
        ],
    )
    app.state.container = container

    # Starlette applies middleware in reverse add-order. Request context
    # should wrap the request so handlers and error paths see bound ids.
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Correlation-ID"],
    )

    register_exception_handlers(app)
    app.include_router(v1_router, prefix="/api")

    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema is not None:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            summary=app.summary,
            description=app.description,
            routes=app.routes,
            tags=app.openapi_tags,
            contact=app.contact,
            license_info=app.license_info,
        )
        schema["servers"] = [
            {"url": cfg.api_root_path or "/", "description": cfg.environment},
        ]
        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

    return app


# Default ASGI entrypoint used by `uvicorn easyid_api.main:app`.
app = create_app()
