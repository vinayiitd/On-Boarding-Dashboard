"""Tests for Rename Organisation application use case."""

from __future__ import annotations

from datetime import UTC, datetime
from types import TracebackType
from typing import cast

import pytest

from easyid_api.application.commands import CommandHandler
from easyid_api.application.organisation.commands.rename import (
    RenameOrganisationCommand,
    RenameOrganisationHandler,
    RenameOrganisationResult,
)
from easyid_api.application.organisation.errors import OrganisationNotFound
from easyid_api.application.unit_of_work import UnitOfWork, UnitOfWorkFactory
from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationRepository,
)
from easyid_domain.organisation.errors import (
    OrganisationNameEmpty,
    OrganisationNameTooLong,
    OrganisationNameUnchanged,
)
from easyid_domain.organisation.events import OrganisationRenamed


class FakeOrganisationRepository:
    def __init__(self) -> None:
        self._store: dict[OrganisationId, Organisation] = {}
        self.get_by_id_calls = 0
        self.save_calls = 0

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        self.get_by_id_calls += 1
        return self._store.get(organisation_id)

    async def save(self, organisation: Organisation) -> None:
        self.save_calls += 1
        self._store[organisation.id] = organisation


class FakeUnitOfWork:
    def __init__(self, repository: FakeOrganisationRepository | None = None) -> None:
        self._organisations = repository or FakeOrganisationRepository()
        self.commit_calls = 0
        self.rollback_calls = 0
        self.entered = False
        self.exited = False

    @property
    def organisations(self) -> OrganisationRepository:
        return self._organisations

    async def __aenter__(self) -> FakeUnitOfWork:
        self.entered = True
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self.exited = True
        del exc_type, exc, tb

    async def commit(self) -> None:
        self.commit_calls += 1

    async def rollback(self) -> None:
        self.rollback_calls += 1


class FakeUnitOfWorkFactory:
    def __init__(self, repository: FakeOrganisationRepository | None = None) -> None:
        self._repository = repository or FakeOrganisationRepository()
        self.created: list[FakeUnitOfWork] = []

    def __call__(self) -> FakeUnitOfWork:
        uow = FakeUnitOfWork(self._repository)
        self.created.append(uow)
        return uow


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 25, 12, 0, tzinfo=UTC))


@pytest.fixture
def repository() -> FakeOrganisationRepository:
    return FakeOrganisationRepository()


@pytest.fixture
def uow_factory(repository: FakeOrganisationRepository) -> FakeUnitOfWorkFactory:
    return FakeUnitOfWorkFactory(repository)


@pytest.fixture
def handler(
    uow_factory: FakeUnitOfWorkFactory,
    clock: FixedClock,
) -> RenameOrganisationHandler:
    return RenameOrganisationHandler(cast(UnitOfWorkFactory, uow_factory), clock)


@pytest.fixture
def organisation(clock: FixedClock, repository: FakeOrganisationRepository) -> Organisation:
    org = Organisation.register(OrganisationName("Acme Pty Ltd"), clock=clock)
    org.collect_events()
    repository._store[org.id] = org
    return org


@pytest.mark.asyncio
async def test_organisation_successfully_renamed(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    repository: FakeOrganisationRepository,
    uow_factory: FakeUnitOfWorkFactory,
    clock: FixedClock,
) -> None:
    clock.advance(minutes=5)
    result = await handler.handle(
        RenameOrganisationCommand(
            organisation_id=organisation.id,
            new_name="Acme Group",
        )
    )

    assert isinstance(result, RenameOrganisationResult)
    assert organisation.name == OrganisationName("Acme Group")
    assert organisation.updated_at == clock.now()

    assert len(uow_factory.created) == 1
    uow = uow_factory.created[0]
    assert uow.entered is True
    assert uow.exited is True
    assert uow.commit_calls == 1
    assert uow.rollback_calls == 0
    assert repository._store[organisation.id].name == OrganisationName("Acme Group")


@pytest.mark.asyncio
async def test_repository_get_by_id_called_once(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    repository: FakeOrganisationRepository,
) -> None:
    await handler.handle(
        RenameOrganisationCommand(
            organisation_id=organisation.id,
            new_name="Acme Group",
        )
    )
    assert repository.get_by_id_calls == 1


@pytest.mark.asyncio
async def test_repository_save_called_once(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    repository: FakeOrganisationRepository,
) -> None:
    await handler.handle(
        RenameOrganisationCommand(
            organisation_id=organisation.id,
            new_name="Acme Group",
        )
    )
    assert repository.save_calls == 1


@pytest.mark.asyncio
async def test_commit_called_once(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    await handler.handle(
        RenameOrganisationCommand(
            organisation_id=organisation.id,
            new_name="Acme Group",
        )
    )
    assert uow_factory.created[0].commit_calls == 1


@pytest.mark.asyncio
async def test_organisation_not_found_when_missing(
    handler: RenameOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
    repository: FakeOrganisationRepository,
) -> None:
    missing_id = OrganisationId.generate()

    with pytest.raises(OrganisationNotFound) as exc_info:
        await handler.handle(
            RenameOrganisationCommand(
                organisation_id=missing_id,
                new_name="Acme Group",
            )
        )

    assert exc_info.value.organisation_id == missing_id
    assert repository.get_by_id_calls == 1
    assert repository.save_calls == 0
    assert uow_factory.created[0].commit_calls == 0


@pytest.mark.asyncio
async def test_invalid_organisation_name_propagates(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    uow_factory: FakeUnitOfWorkFactory,
    repository: FakeOrganisationRepository,
) -> None:
    with pytest.raises(OrganisationNameEmpty):
        await handler.handle(
            RenameOrganisationCommand(
                organisation_id=organisation.id,
                new_name="   ",
            )
        )

    assert repository.save_calls == 0
    assert uow_factory.created[0].commit_calls == 0
    assert organisation.name == OrganisationName("Acme Pty Ltd")


@pytest.mark.asyncio
async def test_too_long_organisation_name_propagates(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    with pytest.raises(OrganisationNameTooLong):
        await handler.handle(
            RenameOrganisationCommand(
                organisation_id=organisation.id,
                new_name="x" * 201,
            )
        )

    assert uow_factory.created[0].commit_calls == 0


@pytest.mark.asyncio
async def test_commit_not_called_if_rename_fails(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
    uow_factory: FakeUnitOfWorkFactory,
    repository: FakeOrganisationRepository,
) -> None:
    with pytest.raises(OrganisationNameUnchanged):
        await handler.handle(
            RenameOrganisationCommand(
                organisation_id=organisation.id,
                new_name="Acme Pty Ltd",
            )
        )

    assert repository.save_calls == 0
    assert uow_factory.created[0].commit_calls == 0


@pytest.mark.asyncio
async def test_organisation_renamed_domain_event_raised(
    handler: RenameOrganisationHandler,
    organisation: Organisation,
) -> None:
    await handler.handle(
        RenameOrganisationCommand(
            organisation_id=organisation.id,
            new_name="Acme Group",
        )
    )

    events = organisation.collect_events()
    assert len(events) == 1
    event = events[0]
    assert isinstance(event, OrganisationRenamed)
    assert event.organisation_id == organisation.id
    assert event.old_name == OrganisationName("Acme Pty Ltd")
    assert event.new_name == OrganisationName("Acme Group")


def test_command_is_frozen_and_slotted() -> None:
    command = RenameOrganisationCommand(
        organisation_id=OrganisationId.generate(),
        new_name="Acme",
    )
    with pytest.raises(AttributeError):
        command.new_name = "Other"  # type: ignore[misc]
    assert hasattr(RenameOrganisationCommand, "__slots__")


def test_result_is_frozen_and_slotted() -> None:
    result = RenameOrganisationResult()
    assert isinstance(result, RenameOrganisationResult)
    assert hasattr(RenameOrganisationResult, "__slots__")


def test_handler_satisfies_command_handler_protocol(
    handler: RenameOrganisationHandler,
) -> None:
    typed: CommandHandler[RenameOrganisationCommand, RenameOrganisationResult] = handler
    assert callable(typed.handle)


def test_fakes_satisfy_unit_of_work_protocols() -> None:
    factory = FakeUnitOfWorkFactory()
    uow = factory()
    assert isinstance(uow, UnitOfWork)
    assert isinstance(uow.organisations, OrganisationRepository)
