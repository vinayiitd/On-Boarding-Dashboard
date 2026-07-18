"""
FastAPI lifespan — process startup and shutdown.

Owns the lifecycle of process-scoped resources (logging, DI container,
engine disposal). Request-scoped resources stay in `api/deps.py`.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from fastapi import FastAPI

from easyid_api.bootstrap.container import AppContainer, build_container
from easyid_api.bootstrap.logging import configure_logging
from easyid_api.config import Settings
from easyid_api.infrastructure.persistence.engine import dispose_engine

Lifespan = Callable[[FastAPI], AbstractAsyncContextManager[None]]


def build_lifespan(settings: Settings) -> Lifespan:
    """
    Return a FastAPI lifespan context manager closed over `settings`.

    Using a factory keeps `create_app` free of nested function defaults
    and makes the lifespan trivial to unit-test.
    """

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        configure_logging(settings)
        container: AppContainer = build_container(settings)
        app.state.container = container
        try:
            yield
        finally:
            await dispose_engine()
            app.state.container = None

    return lifespan
