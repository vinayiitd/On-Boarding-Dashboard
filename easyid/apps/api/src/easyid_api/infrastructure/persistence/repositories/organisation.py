"""SQLAlchemy implementation of OrganisationRepository."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.infrastructure.persistence.ids import to_uuid
from easyid_api.infrastructure.persistence.mappings.organisation import (
    OrganisationModel,
    apply_domain,
    from_domain,
    to_domain,
)
from easyid_domain.organisation import Organisation, OrganisationId


class SqlAlchemyOrganisationRepository:
    """
    Infrastructure adapter for `OrganisationRepository`.

    Loads and saves Organisation aggregates through SQLAlchemy. Transaction
    boundaries belong to the Unit of Work — this class never commits, rolls
    back, or flushes. Mapping stays in the mappings module.
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
        in place via `apply_domain`.
        """
        model = await self._session.get(OrganisationModel, to_uuid(organisation.id))
        if model is None:
            self._session.add(from_domain(organisation))
            return

        apply_domain(model, organisation)
