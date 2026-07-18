"""SQLAlchemy-backed Unit of Work."""

from __future__ import annotations

from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


class SqlAlchemyUnitOfWork:
    """
    Infrastructure Unit of Work wrapping a single `AsyncSession`.

    Satisfies `application.ports.UnitOfWork`. The `session` attribute is
    for infrastructure repositories only — it is not part of the port.
    """

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory
        self._session: AsyncSession | None = None
        self._committed = False

    @property
    def session(self) -> AsyncSession:
        """Return the active session; raises if the UoW is not entered."""
        if self._session is None:
            raise RuntimeError("UnitOfWork has not been entered.")
        return self._session

    async def __aenter__(self) -> Self:
        self._session = self._session_factory()
        self._committed = False
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is not None or not self._committed:
                await self.rollback()
        finally:
            if self._session is not None:
                await self._session.close()
                self._session = None

    async def commit(self) -> None:
        await self.session.commit()
        self._committed = True

    async def rollback(self) -> None:
        if self._session is not None:
            await self._session.rollback()
        self._committed = False
