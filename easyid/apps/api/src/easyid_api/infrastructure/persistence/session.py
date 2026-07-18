"""Async session context manager."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.infrastructure.persistence.engine import get_sessionmaker


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    """
    Yield a session inside an implicit transaction.

    Commits on clean exit, rolls back if the caller raises, and always closes
    the session on the way out.
    """
    factory = get_sessionmaker()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
