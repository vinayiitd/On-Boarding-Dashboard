"""
Composition root.

Builds the process-scoped object graph. Kept deliberately thin — no
business logic, no FastAPI types. Request-scoped resources (Unit of Work)
are resolved in `api/deps.py`.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from easyid_api.application.ports.health import DatabaseHealth
from easyid_api.application.ports.unit_of_work import UnitOfWork
from easyid_api.config import Settings
from easyid_api.infrastructure.persistence.engine import build_engine
from easyid_api.infrastructure.persistence.health import SqlAlchemyDatabaseHealth
from easyid_api.infrastructure.persistence.session import build_session_factory
from easyid_api.infrastructure.persistence.unit_of_work import SqlAlchemyUnitOfWork


@dataclass(frozen=True, slots=True)
class AppContainer:
    """
    Immutable process-scoped dependencies.

    Holds the async engine, session factory, and port adapters. Request-
    scoped units of work are opened via `unit_of_work()`.
    """

    settings: Settings
    engine: AsyncEngine
    session_factory: async_sessionmaker[AsyncSession]
    database_health: DatabaseHealth

    def unit_of_work(self) -> UnitOfWork:
        """Open a new Unit of Work bound to this process's session factory."""
        return SqlAlchemyUnitOfWork(self.session_factory)


def build_container(settings: Settings) -> AppContainer:
    """Wire process-scoped collaborators and return the composed container."""
    engine = build_engine(settings)
    session_factory = build_session_factory(engine)
    database_health: DatabaseHealth = SqlAlchemyDatabaseHealth(engine)
    return AppContainer(
        settings=settings,
        engine=engine,
        session_factory=session_factory,
        database_health=database_health,
    )
