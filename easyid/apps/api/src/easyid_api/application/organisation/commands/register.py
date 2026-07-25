"""Register Organisation — first application write use case."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.application.commands import Command
from easyid_api.application.unit_of_work import UnitOfWorkFactory
from easyid_domain.kernel.clock import Clock
from easyid_domain.organisation import Organisation, OrganisationId, OrganisationName


@dataclass(frozen=True, slots=True)
class RegisterOrganisationCommand(Command):
    """Application input for registering a new organisation."""

    name: str


@dataclass(frozen=True, slots=True)
class RegisterOrganisationResult:
    """Identity of the newly registered organisation."""

    organisation_id: OrganisationId


class RegisterOrganisationHandler:
    """
    Orchestrates organisation registration.

    Creates the domain aggregate, persists it through the UnitOfWork, and
    returns the new identity. Business rules live in the domain.
    """

    def __init__(self, uow_factory: UnitOfWorkFactory, clock: Clock) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def handle(
        self,
        command: RegisterOrganisationCommand,
    ) -> RegisterOrganisationResult:
        """Register a new organisation and return its id."""
        name = OrganisationName(command.name)
        organisation = Organisation.register(name, clock=self._clock)

        async with self._uow_factory() as uow:
            await uow.organisations.save(organisation)
            await uow.commit()

        return RegisterOrganisationResult(organisation_id=organisation.id)
