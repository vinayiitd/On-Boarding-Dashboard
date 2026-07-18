"""
FastAPI dependency-injection callables.

Endpoints declare their needs via `Depends(...)` from this module so nothing
in `application/` or `domain/` has to import FastAPI.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.config import Settings, get_settings
from easyid_api.infrastructure.db.session import get_session


async def db_session() -> AsyncIterator[AsyncSession]:
    """Yield a per-request async SQLAlchemy session."""
    async with get_session() as session:
        yield session


SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSessionDep = Annotated[AsyncSession, Depends(db_session)]
