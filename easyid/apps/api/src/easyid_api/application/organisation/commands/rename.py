"""Rename Organisation — application write use case for updating an aggregate."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.application.commands import Command
from easyid_api.application.organisation.errors import OrganisationNotFound
from easyid_api.application.unit_of_work import UnitOfWorkFactory
from easyid_domain.kernel.clock import Clock
from easyid_domain.organisation import OrganisationId, OrganisationName


@dataclass(frozen=True, slots=True)
class RenameOrganisationCommand(Command):
    """Application input for renaming an existing organisation."""

    organisation_id: OrganisationId
    new_name: str


@dataclass(frozen=True, slots=True)
class RenameOrganisationResult:
    """Empty result — reserved for future expansion of the rename boundary."""


class RenameOrganisationHandler:
    """
    Orchestrates renaming an organisation.

    Loads the aggregate through the UnitOfWork, applies the domain rename,
    persists, and commits. Business rules live in the domain.
    """

    def __init__(self, uow_factory: UnitOfWorkFactory, clock: Clock) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def handle(
        self,
        command: RenameOrganisationCommand,
    ) -> RenameOrganisationResult:
        """Rename an organisation and return an empty result."""
        async with self._uow_factory() as uow:
            organisation = await uow.organisations.get_by_id(command.organisation_id)
            if organisation is None:
                raise OrganisationNotFound(command.organisation_id)

            new_name = OrganisationName(command.new_name)
            organisation.rename(new_name, clock=self._clock)
            await uow.organisations.save(organisation)
            await uow.commit()

        return RenameOrganisationResult()
