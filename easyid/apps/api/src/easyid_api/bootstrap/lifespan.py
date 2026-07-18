"""
FastAPI lifespan — process startup and shutdown.

Owns process logging configuration and engine disposal. The composition
root is attached in `create_app` so request dependencies resolve even when
an ASGI test client does not run lifespan hooks.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from fastapi import FastAPI

from easyid_api.bootstrap.logging import configure_logging
from easyid_api.config import Settings

logger = logging.getLogger(__name__)

Lifespan = Callable[[FastAPI], AbstractAsyncContextManager[None]]


def build_lifespan(settings: Settings) -> Lifespan:
    """Return a FastAPI lifespan context manager closed over `settings`."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        configure_logging(settings)
        logger.info(
            "application.startup environment=%s version=%s",
            settings.environment,
            settings.app_version,
        )
        try:
            yield
        finally:
            container = getattr(app.state, "container", None)
            engine = getattr(container, "engine", None)
            if engine is not None:
                await engine.dispose()
                logger.info("database.engine_disposed")
            logger.info("application.shutdown")

    return lifespan
