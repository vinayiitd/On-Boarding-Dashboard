"""Tests for Register Organisation application use case."""

from __future__ import annotations

from datetime import UTC, datetime
from types import TracebackType
from typing import cast
from unittest.mock import MagicMock

import pytest

from easyid_api.application.commands import CommandHandler
from easyid_api.application.organisation.commands.register import (
    RegisterOrganisationCommand,
    RegisterOrganisationHandler,
    RegisterOrganisationResult,
)
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
)


class FakeOrganisationRepository:
    def __init__(self) -> None:
        self.saved: list[Organisation] = []

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        for organisation in self.saved:
            if organisation.id == organisation_id:
                return organisation
        return None

    async def save(self, organisation: Organisation) -> None:
        self.saved.append(organisation)


class FakeUnitOfWork:
    def __init__(self) -> None:
        self._organisations = FakeOrganisationRepository()
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
    def __init__(self) -> None:
        self.created: list[FakeUnitOfWork] = []

    def __call__(self) -> FakeUnitOfWork:
        uow = FakeUnitOfWork()
        self.created.append(uow)
        return uow


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 25, 12, 0, tzinfo=UTC))


@pytest.fixture
def uow_factory() -> FakeUnitOfWorkFactory:
    return FakeUnitOfWorkFactory()


@pytest.fixture
def handler(
    uow_factory: FakeUnitOfWorkFactory,
    clock: FixedClock,
) -> RegisterOrganisationHandler:
    return RegisterOrganisationHandler(cast(UnitOfWorkFactory, uow_factory), clock)


@pytest.mark.asyncio
async def test_successful_registration(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
    clock: FixedClock,
) -> None:
    result = await handler.handle(RegisterOrganisationCommand(name="Acme Pty Ltd"))

    assert isinstance(result, RegisterOrganisationResult)
    assert isinstance(result.organisation_id, OrganisationId)

    assert len(uow_factory.created) == 1
    uow = uow_factory.created[0]
    assert uow.entered is True
    assert uow.exited is True
    assert uow.commit_calls == 1
    assert uow.rollback_calls == 0
    assert len(uow._organisations.saved) == 1

    saved = uow._organisations.saved[0]
    assert saved.id == result.organisation_id
    assert saved.name == OrganisationName("Acme Pty Ltd")
    assert saved.created_at == clock.now()
    assert saved.updated_at == clock.now()


@pytest.mark.asyncio
async def test_constructs_organisation_name_from_command(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    await handler.handle(RegisterOrganisationCommand(name="  Acme Pty Ltd  "))

    saved = uow_factory.created[0]._organisations.saved[0]
    assert saved.name == OrganisationName("Acme Pty Ltd")
    assert saved.name.value == "Acme Pty Ltd"


@pytest.mark.asyncio
async def test_creates_aggregate_via_organisation_register(
    uow_factory: FakeUnitOfWorkFactory,
    clock: FixedClock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    spy = MagicMock(wraps=Organisation.register)
    monkeypatch.setattr(Organisation, "register", spy)

    handler = RegisterOrganisationHandler(cast(UnitOfWorkFactory, uow_factory), clock)
    result = await handler.handle(RegisterOrganisationCommand(name="Acme Pty Ltd"))

    spy.assert_called_once_with(OrganisationName("Acme Pty Ltd"), clock=clock)
    saved = uow_factory.created[0]._organisations.saved[0]
    assert isinstance(saved, Organisation)
    assert result.organisation_id == saved.id


@pytest.mark.asyncio
async def test_repository_save_invoked_once(
    uow_factory: FakeUnitOfWorkFactory,
    handler: RegisterOrganisationHandler,
) -> None:
    await handler.handle(RegisterOrganisationCommand(name="Acme Pty Ltd"))

    saved_list = uow_factory.created[0]._organisations.saved
    assert len(saved_list) == 1
    saved = saved_list[0]
    assert isinstance(saved, Organisation)
    assert saved.name == OrganisationName("Acme Pty Ltd")


@pytest.mark.asyncio
async def test_commit_invoked_once(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    await handler.handle(RegisterOrganisationCommand(name="Acme Pty Ltd"))
    assert uow_factory.created[0].commit_calls == 1


@pytest.mark.asyncio
async def test_empty_organisation_name_propagates(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    with pytest.raises(OrganisationNameEmpty):
        await handler.handle(RegisterOrganisationCommand(name="   "))

    assert uow_factory.created == []


@pytest.mark.asyncio
async def test_too_long_organisation_name_propagates(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    with pytest.raises(OrganisationNameTooLong):
        await handler.handle(RegisterOrganisationCommand(name="x" * 201))

    assert uow_factory.created == []


@pytest.mark.asyncio
async def test_commit_not_called_when_name_invalid(
    handler: RegisterOrganisationHandler,
    uow_factory: FakeUnitOfWorkFactory,
) -> None:
    with pytest.raises(OrganisationNameEmpty):
        await handler.handle(RegisterOrganisationCommand(name=""))

    assert uow_factory.created == []


@pytest.mark.asyncio
async def test_commit_not_called_when_save_fails(clock: FixedClock) -> None:
    class FailingRepository(FakeOrganisationRepository):
        async def save(self, organisation: Organisation) -> None:
            raise RuntimeError("persistence failed")

    class FailingUnitOfWork(FakeUnitOfWork):
        def __init__(self) -> None:
            super().__init__()
            self._organisations = FailingRepository()

    failing_uow = FailingUnitOfWork()

    class Factory:
        def __call__(self) -> FakeUnitOfWork:
            return failing_uow

    handler = RegisterOrganisationHandler(cast(UnitOfWorkFactory, Factory()), clock)

    with pytest.raises(RuntimeError, match="persistence failed"):
        await handler.handle(RegisterOrganisationCommand(name="Acme Pty Ltd"))

    assert failing_uow.commit_calls == 0
    assert failing_uow.entered is True
    assert failing_uow.exited is True


def test_command_is_frozen_and_slotted() -> None:
    command = RegisterOrganisationCommand(name="Acme")
    assert isinstance(command, RegisterOrganisationCommand)
    with pytest.raises(AttributeError):
        command.name = "Other"  # type: ignore[misc]
    assert hasattr(RegisterOrganisationCommand, "__slots__")


def test_result_is_frozen_and_slotted() -> None:
    result = RegisterOrganisationResult(organisation_id=OrganisationId.generate())
    with pytest.raises(AttributeError):
        result.organisation_id = OrganisationId.generate()  # type: ignore[misc]
    assert hasattr(RegisterOrganisationResult, "__slots__")


def test_handler_satisfies_command_handler_protocol(
    handler: RegisterOrganisationHandler,
) -> None:
    typed: CommandHandler[RegisterOrganisationCommand, RegisterOrganisationResult] = handler
    assert callable(typed.handle)


def test_fakes_satisfy_unit_of_work_protocols() -> None:
    factory = FakeUnitOfWorkFactory()
    uow = factory()
    assert isinstance(uow, UnitOfWork)
    assert isinstance(uow.organisations, OrganisationRepository)
