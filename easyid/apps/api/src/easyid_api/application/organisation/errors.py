"""Organisation application-layer errors."""

from __future__ import annotations

from easyid_domain.organisation import OrganisationId


class OrganisationNotFound(Exception):
    """Raised when a use case cannot load the requested organisation."""

    def __init__(self, organisation_id: OrganisationId) -> None:
        self.organisation_id = organisation_id
        super().__init__(f"Organisation not found: {organisation_id}")
