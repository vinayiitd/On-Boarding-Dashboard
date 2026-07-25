"""Get Organisation By ID — first application read use case."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.application.organisation.errors import OrganisationNotFound
from easyid_api.application.queries import Query
from easyid_domain.organisation import (
    OrganisationId,
    OrganisationRepository,
    OrganisationStatus,
)


@dataclass(frozen=True, slots=True)
class GetOrganisationByIdQuery(Query):
    """Application input for loading an organisation by id."""

    organisation_id: OrganisationId


@dataclass(frozen=True, slots=True)
class GetOrganisationByIdResult:
    """Read projection for an organisation — not the domain aggregate."""

    organisation_id: OrganisationId
    name: str
    status: OrganisationStatus
    version: int


class GetOrganisationByIdHandler:
    """
    Loads an organisation and returns a read projection.

    Queries do not open a transactional boundary or mutate state. The
    repository is injected directly.
    """

    def __init__(self, organisations: OrganisationRepository) -> None:
        self._organisations = organisations

    async def handle(
        self,
        query: GetOrganisationByIdQuery,
    ) -> GetOrganisationByIdResult:
        """Return a projection for the organisation, or raise if missing."""
        organisation = await self._organisations.get_by_id(query.organisation_id)
        if organisation is None:
            raise OrganisationNotFound(query.organisation_id)

        return GetOrganisationByIdResult(
            organisation_id=organisation.id,
            name=organisation.name.value,
            status=organisation.status,
            version=organisation.version,
        )
