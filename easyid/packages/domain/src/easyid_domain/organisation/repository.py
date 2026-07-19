"""Organisation repository port — persistence-agnostic aggregate access."""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from easyid_domain.organisation.identifiers import OrganisationId
from easyid_domain.organisation.organisation import Organisation


@runtime_checkable
class OrganisationRepository(Protocol):
    """
    Persistence port for the Organisation aggregate.

    Application use cases depend on this Protocol. Infrastructure provides
    concrete implementations (e.g. SQLAlchemy). The domain package itself
    never imports ORM or I/O types.

    Misses on lookup return `None`. Mapping a miss to an application-layer
    failure (e.g. `EntityNotFound`) is the caller's responsibility.

    Method names deliberately avoid CRUD verbs (`insert` / `update` /
    `delete`). There is no removal API — easyID never deletes aggregates.
    """

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        """Return the organisation with the given id, or `None` if missing."""
        ...

    async def save(self, organisation: Organisation) -> None:
        """
        Persist the organisation within the current unit of work.

        Covers both newly registered and previously loaded aggregates.
        """
        ...
