"""
Async engine + sessionmaker factories.

The engine is created lazily (on first access) and cached for the lifetime
of the process. Tests that need to reset state should call `dispose_engine()`
and get a fresh one.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.ext.asyncio import AsyncSession as SqlaAsyncSession

from easyid_api.config import Settings, get_settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[SqlaAsyncSession] | None = None


def get_engine(settings: Settings | None = None) -> AsyncEngine:
    """Return the cached async engine, creating it on first call."""
    global _engine
    if _engine is None:
        cfg = settings or get_settings()
        _engine = create_async_engine(
            cfg.database_url,
            echo=cfg.db_echo,
            future=True,
            pool_size=cfg.db_pool_size,
            max_overflow=cfg.db_max_overflow,
            pool_timeout=cfg.db_pool_timeout,
            pool_recycle=cfg.db_pool_recycle,
            pool_pre_ping=True,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[SqlaAsyncSession]:
    """Return the cached async session factory."""
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            bind=get_engine(),
            class_=SqlaAsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _sessionmaker


async def dispose_engine() -> None:
    """Close the engine's connection pool. Call on shutdown / in tests."""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
