"""Async SQLAlchemy engine factory."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool

from easyid_api.config import Settings


def build_engine(settings: Settings) -> AsyncEngine:
    """
    Build a process-scoped async engine for PostgreSQL via asyncpg.

    `pool_pre_ping` detects stale connections after idle timeouts.
    Tests use `NullPool` so connections never outlive the event loop.
    """
    if settings.environment == "test":
        return create_async_engine(
            settings.database_url,
            echo=settings.database_echo,
            poolclass=NullPool,
            pool_pre_ping=True,
        )

    return create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        pool_recycle=settings.database_pool_recycle_seconds,
    )
