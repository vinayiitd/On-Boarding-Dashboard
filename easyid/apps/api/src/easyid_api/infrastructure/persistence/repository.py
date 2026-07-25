"""Shared SQLAlchemy repository infrastructure."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


class SessionRepository:
    """
    Session-bound base for concrete mapping repositories.

    Holds the `AsyncSession` from the active unit of work. Subclasses add
    explicit persist/query methods for one mapping — there is no generic
    CRUD surface and no Organisation (or other aggregate) implementation
    here.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
