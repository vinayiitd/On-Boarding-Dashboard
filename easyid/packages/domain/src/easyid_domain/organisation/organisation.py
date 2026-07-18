"""Organisation aggregate root."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from easyid_domain.kernel.aggregate import AggregateRoot
from easyid_domain.kernel.clock import Clock
from easyid_domain.organisation.errors import (
    OrganisationAlreadyActive,
    OrganisationAlreadySuspended,
    OrganisationIsSuspended,
    OrganisationNameUnchanged,
)
from easyid_domain.organisation.events import (
    OrganisationReactivated,
    OrganisationRegistered,
    OrganisationRenamed,
    OrganisationSuspended,
)
from easyid_domain.organisation.identifiers import OrganisationId
from easyid_domain.organisation.name import OrganisationName
from easyid_domain.organisation.status import OrganisationStatus


@dataclass(eq=False)
class Organisation(AggregateRoot[OrganisationId]):
    """
    Consistency boundary for an organisation's identity, name, and status.

    Construct via `register()`. Mutations go through `rename`, `suspend`, and
    `reactivate`, each raising the corresponding domain event.
    """

    name: OrganisationName
    status: OrganisationStatus
    created_at: datetime
    updated_at: datetime

    @classmethod
    def register(
        cls,
        name: OrganisationName,
        *,
        clock: Clock,
        organisation_id: OrganisationId | None = None,
    ) -> Organisation:
        """Register a new active organisation and raise `OrganisationRegistered`."""
        org_id = organisation_id if organisation_id is not None else OrganisationId.generate()
        now = clock.now()
        organisation = cls(
            id=org_id,
            name=name,
            status=OrganisationStatus.ACTIVE,
            created_at=now,
            updated_at=now,
        )
        organisation.raise_event(OrganisationRegistered(organisation_id=org_id, name=name))
        return organisation

    def rename(self, new_name: OrganisationName, *, clock: Clock) -> None:
        """Change the organisation name, or raise if suspended / unchanged."""
        if self.status is OrganisationStatus.SUSPENDED:
            raise OrganisationIsSuspended()
        if new_name == self.name:
            raise OrganisationNameUnchanged()

        old_name = self.name
        self.name = new_name
        self.updated_at = clock.now()
        self.raise_event(
            OrganisationRenamed(
                organisation_id=self.id,
                old_name=old_name,
                new_name=new_name,
            )
        )

    def suspend(self, *, clock: Clock) -> None:
        """Suspend an active organisation, or raise if already suspended."""
        if self.status is OrganisationStatus.SUSPENDED:
            raise OrganisationAlreadySuspended()

        self.status = OrganisationStatus.SUSPENDED
        self.updated_at = clock.now()
        self.raise_event(OrganisationSuspended(organisation_id=self.id))

    def reactivate(self, *, clock: Clock) -> None:
        """Reactivate a suspended organisation, or raise if already active."""
        if self.status is OrganisationStatus.ACTIVE:
            raise OrganisationAlreadyActive()

        self.status = OrganisationStatus.ACTIVE
        self.updated_at = clock.now()
        self.raise_event(OrganisationReactivated(organisation_id=self.id))
