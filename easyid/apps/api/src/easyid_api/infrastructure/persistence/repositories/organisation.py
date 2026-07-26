"""SQLAlchemy implementation of OrganisationRepository."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.infrastructure.persistence.ids import to_uuid
from easyid_api.infrastructure.persistence.mappings.organisation import (
    OrganisationModel,
    from_domain,
    to_domain,
)
from easyid_domain.organisation import Organisation, OrganisationId


class SqlAlchemyOrganisationRepository:
    """
    Load and save Organisation aggregates through SQLAlchemy.

    Transaction boundaries belong to the Unit of Work — this class never
    commits, rolls back, or flushes.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        """Return the organisation aggregate, or `None` if missing."""
        model = await self._session.get(OrganisationModel, to_uuid(organisation_id))
        if model is None:
            return None
        return to_domain(model)

    async def save(self, organisation: Organisation) -> None:
        """
        Persist the organisation within the current session.

        Inserts when no row exists; otherwise updates the existing ORM row
        in place (name, status, version, updated_at).
        """
        model = await self._session.get(OrganisationModel, to_uuid(organisation.id))
        if model is None:
            self._session.add(from_domain(organisation))
            return

        model.name = organisation.name.value
        model.status = organisation.status.value
        model.version = organisation.version
        model.updated_at = organisation.updated_at
