"""Repository port — persistence-agnostic aggregate access."""

from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID


class AbstractRepository[T](ABC):
    """
    Base repository interface for a single persistence type.

    Application use cases depend on this ABC (or a narrower subclass).
    Infrastructure provides SQLAlchemy-backed implementations. No ORM
    types appear in the signature — `T` is a domain entity or a
    persistence-mapping DTO defined by the concrete repository contract.
    """

    @abstractmethod
    async def get_by_id(self, entity_id: UUID) -> T | None:
        """
        Return the entity with the given id, or `None` if missing.

        Application use cases that treat a miss as a failure should map
        `None` to `Result.Err(EntityNotFound(...))` — not a domain error.
        """

    @abstractmethod
    async def add(self, entity: T) -> None:
        """Register a new entity for persistence within the current UoW."""

    @abstractmethod
    async def remove(self, entity: T) -> None:
        """Mark an entity for deletion within the current UoW."""
