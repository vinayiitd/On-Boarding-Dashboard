"""Unit of Work port — atomic application-level persistence boundary."""

from __future__ import annotations

from types import TracebackType
from typing import Protocol, Self


class UnitOfWork(Protocol):
    """
    Request-scoped unit of work.

    Command handlers obtain a UoW, perform repository operations through it,
    then `commit()` explicitly. Exiting the context without a commit rolls
    back. The application never sees the underlying persistence session.
    """

    async def __aenter__(self) -> Self:
        """Open the unit of work (acquire a session / transaction)."""
        ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        """Roll back on error or missing commit; always release resources."""
        ...

    async def commit(self) -> None:
        """Persist all work performed within this unit of work."""
        ...

    async def rollback(self) -> None:
        """Discard all work performed within this unit of work."""
        ...


class UnitOfWorkFactory(Protocol):
    """Process-scoped factory that opens a new `UnitOfWork` per call."""

    def __call__(self) -> UnitOfWork:
        """Return a new, not-yet-entered unit of work."""
        ...
