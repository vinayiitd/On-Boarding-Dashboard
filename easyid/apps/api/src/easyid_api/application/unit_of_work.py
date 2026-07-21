"""Unit of Work port — atomic application-level persistence boundary."""

from __future__ import annotations

from types import TracebackType
from typing import Protocol, Self, runtime_checkable

from easyid_domain.organisation import OrganisationRepository


@runtime_checkable
class UnitOfWork(Protocol):
    """
    Request-scoped unit of work.

    Command handlers obtain a UoW, perform repository operations through the
    repositories exposed on this boundary, then `commit()` explicitly. Exiting
    the context without a commit rolls back. The application never sees the
    underlying persistence session.

    Repositories that participate in the transaction are accessed as read-only
    properties (e.g. `organisations`). Future aggregates (parties, evidence,
    policies, cases, risk, …) follow the same pattern.
    """

    @property
    def organisations(self) -> OrganisationRepository:
        """Organisation aggregate repository scoped to this unit of work."""
        ...

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


@runtime_checkable
class UnitOfWorkFactory(Protocol):
    """Process-scoped factory that opens a new `UnitOfWork` per call."""

    def __call__(self) -> UnitOfWork:
        """Return a new, not-yet-entered unit of work."""
        ...
