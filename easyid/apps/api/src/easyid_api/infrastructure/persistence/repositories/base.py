"""SQLAlchemy base repository — infrastructure implementation of AbstractRepository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.application.ports.repository import AbstractRepository


class SqlAlchemyRepository[TMapping](AbstractRepository[TMapping]):
    """
    Generic repository over a persistence mapping class.

    Concrete feature repositories subclass this and bind `mapping_cls`.
    The session always comes from the active `SqlAlchemyUnitOfWork`.
    """

    mapping_cls: type[TMapping]

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, entity_id: UUID) -> TMapping | None:
        return await self._session.get(self.mapping_cls, entity_id)

    async def add(self, entity: TMapping) -> None:
        self._session.add(entity)

    async def remove(self, entity: TMapping) -> None:
        await self._session.delete(entity)
