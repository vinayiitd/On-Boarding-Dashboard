"""Database health probe backed by SQLAlchemy."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from easyid_api.application.ports.health import DatabaseHealthStatus

logger = logging.getLogger(__name__)


class SqlAlchemyDatabaseHealth:
    """Run `SELECT 1` against the process engine."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def check(self) -> DatabaseHealthStatus:
        try:
            async with self._engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception as exc:
            logger.warning("database.health_check_failed error=%s", exc)
            return DatabaseHealthStatus(status="down", detail="database unreachable")
        return DatabaseHealthStatus(status="up")
