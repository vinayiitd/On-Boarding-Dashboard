"""Tests for APP-001 application foundation (CQRS ports + UnitOfWork)."""

from __future__ import annotations

import ast
import inspect
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from types import TracebackType
from typing import get_args, get_origin, get_type_hints

import pytest

from easyid_api.application import (
    Command,
    CommandHandler,
    Query,
    QueryHandler,
    UnitOfWork,
    UnitOfWorkFactory,
)
from easyid_api.application.commands import (
    Command as CommandFromPackage,
)
from easyid_api.application.commands import (
    CommandHandler as CommandHandlerFromPackage,
)
from easyid_api.application.commands.handler import TCommand_contra, TResult_co
from easyid_api.application.ports.unit_of_work import (
    UnitOfWork as UnitOfWorkFromPorts,
)
from easyid_api.application.ports.unit_of_work import (
    UnitOfWorkFactory as UnitOfWorkFactoryFromPorts,
)
from easyid_api.application.queries import Query as QueryFromPackage
from easyid_api.application.queries import QueryHandler as QueryHandlerFromPackage
from easyid_api.application.queries.handler import TQuery_contra
from easyid_api.application.queries.handler import TResult_co as QueryTResult_co
from easyid_api.application.unit_of_work import (
    UnitOfWork as UnitOfWorkFromModule,
)
from easyid_api.application.unit_of_work import (
    UnitOfWorkFactory as UnitOfWorkFactoryFromModule,
)
from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationRepository,
)

APPLICATION_ROOT = Path(__file__).resolve().parents[1] / "src" / "easyid_api" / "application"
FOUNDATION_MODULES = (
    APPLICATION_ROOT / "commands" / "command.py",
    APPLICATION_ROOT / "commands" / "handler.py",
    APPLICATION_ROOT / "queries" / "query.py",
    APPLICATION_ROOT / "queries" / "handler.py",
    APPLICATION_ROOT / "unit_of_work.py",
)
FORBIDDEN_IMPORT_PREFIXES = (
    "fastapi",
    "sqlalchemy",
    "alembic",
    "asyncpg",
    "easyid_api.infrastructure",
    "easyid_api.api",
    "easyid_api.bootstrap",
)


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RegisterOrganisationCommand:
    name: str


@dataclass(frozen=True, slots=True)
class GetOrganisationQuery:
    organisation_id: str


@dataclass(frozen=True, slots=True)
class OrganisationView:
    organisation_id: str
    name: str


class FakeOrganisationRepository:
    """In-memory OrganisationRepository for UnitOfWork conformance tests."""

    def __init__(self) -> None:
        self._store: dict[OrganisationId, Organisation] = {}

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        return self._store.get(organisation_id)

    async def save(self, organisation: Organisation) -> None:
        self._store[organisation.id] = organisation


class FakeUnitOfWork:
    """In-memory UoW that records commit / rollback without I/O."""

    def __init__(self) -> None:
        self.entered = False
        self.committed = False
        self.rolled_back = False
        self.exited = False
        self._organisations = FakeOrganisationRepository()

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
        if not self.committed:
            self.rolled_back = True
        del exc_type, exc, tb

    async def commit(self) -> None:
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True


class FakeUnitOfWorkFactory:
    def __init__(self) -> None:
        self.created: list[FakeUnitOfWork] = []

    def __call__(self) -> FakeUnitOfWork:
        uow = FakeUnitOfWork()
        self.created.append(uow)
        return uow


class RegisterOrganisationHandler:
    def __init__(
        self,
        uow_factory: UnitOfWorkFactory,
        *,
        clock: FixedClock | None = None,
    ) -> None:
        self._uow_factory = uow_factory
        self._clock = clock or FixedClock(datetime(2026, 7, 18, 12, 0, tzinfo=UTC))
        self.calls: list[RegisterOrganisationCommand] = []

    async def handle(self, command: RegisterOrganisationCommand) -> str:
        self.calls.append(command)
        uow = self._uow_factory()
        async with uow:
            organisation = Organisation.register(
                OrganisationName(command.name),
                clock=self._clock,
            )
            await uow.organisations.save(organisation)
            await uow.commit()
            return str(organisation.id.value)


class GetOrganisationHandler:
    def __init__(self, catalogue: dict[str, str]) -> None:
        self._catalogue = catalogue

    async def handle(self, query: GetOrganisationQuery) -> OrganisationView | None:
        name = self._catalogue.get(query.organisation_id)
        if name is None:
            return None
        return OrganisationView(
            organisation_id=query.organisation_id,
            name=name,
        )


# ---------------------------------------------------------------------------
# Export / identity
# ---------------------------------------------------------------------------


def test_package_exports_match_module_definitions() -> None:
    assert Command is CommandFromPackage
    assert CommandHandler is CommandHandlerFromPackage
    assert Query is QueryFromPackage
    assert QueryHandler is QueryHandlerFromPackage
    assert UnitOfWork is UnitOfWorkFromModule
    assert UnitOfWorkFactory is UnitOfWorkFactoryFromModule
    assert UnitOfWorkFromPorts is UnitOfWork
    assert UnitOfWorkFactoryFromPorts is UnitOfWorkFactory


def test_command_and_query_are_distinct_protocols() -> None:
    assert Command is not Query
    assert CommandHandler is not QueryHandler


def test_handler_typevars_are_bound_and_variant() -> None:
    assert TCommand_contra.__bound__ is Command
    assert TCommand_contra.__contravariant__ is True
    assert TResult_co.__covariant__ is True
    assert TQuery_contra.__bound__ is Query
    assert TQuery_contra.__contravariant__ is True
    assert QueryTResult_co.__covariant__ is True


# ---------------------------------------------------------------------------
# Protocol shapes
# ---------------------------------------------------------------------------


def test_command_handler_handle_signature() -> None:
    hints = get_type_hints(CommandHandler.handle)
    assert hints["command"] is TCommand_contra
    assert hints["return"] is TResult_co
    assert "async def handle" in inspect.getsource(CommandHandler)


def test_query_handler_handle_signature() -> None:
    hints = get_type_hints(QueryHandler.handle)
    assert hints["query"] is TQuery_contra
    assert hints["return"] is QueryTResult_co
    assert "async def handle" in inspect.getsource(QueryHandler)


def test_unit_of_work_exposes_async_transaction_api() -> None:
    public = {
        name
        for name, value in vars(UnitOfWork).items()
        if callable(value) and (name.startswith("__a") or not name.startswith("_"))
    }
    assert {"__aenter__", "__aexit__", "commit", "rollback"} <= public
    assert "delete" not in public
    assert "remove" not in public

    organisations_prop = UnitOfWork.__dict__["organisations"]
    assert isinstance(organisations_prop, property)
    assert organisations_prop.fget is not None
    org_hints = get_type_hints(organisations_prop.fget)
    assert org_hints["return"] is OrganisationRepository

    commit_hints = get_type_hints(UnitOfWork.commit)
    assert commit_hints["return"] is type(None)
    rollback_hints = get_type_hints(UnitOfWork.rollback)
    assert rollback_hints["return"] is type(None)


def test_unit_of_work_factory_returns_unit_of_work() -> None:
    hints = get_type_hints(UnitOfWorkFactory.__call__)
    assert hints["return"] is UnitOfWork


# ---------------------------------------------------------------------------
# Structural conformance + behaviour
# ---------------------------------------------------------------------------


def test_fakes_satisfy_unit_of_work_protocols() -> None:
    factory = FakeUnitOfWorkFactory()
    uow = factory()
    assert isinstance(uow, UnitOfWork)
    assert isinstance(factory, UnitOfWorkFactory)
    assert isinstance(uow.organisations, OrganisationRepository)
    assert callable(uow.commit)
    assert callable(uow.rollback)
    assert callable(uow.__aenter__)
    assert callable(uow.__aexit__)
    assert callable(factory)


@pytest.mark.asyncio
async def test_command_handler_persists_via_unit_of_work() -> None:
    factory = FakeUnitOfWorkFactory()
    handler: CommandHandler[RegisterOrganisationCommand, str] = RegisterOrganisationHandler(factory)

    organisation_id = await handler.handle(RegisterOrganisationCommand(name="Acme"))

    assert len(factory.created) == 1
    uow = factory.created[0]
    assert uow.entered is True
    assert uow.committed is True
    assert uow.rolled_back is False
    assert uow.exited is True

    loaded = await uow.organisations.get_by_id(OrganisationId.from_str(organisation_id))
    assert loaded is not None
    assert loaded.name == OrganisationName("Acme")


@pytest.mark.asyncio
async def test_command_handler_rolls_back_when_commit_skipped() -> None:
    class FailingHandler:
        def __init__(self, uow_factory: UnitOfWorkFactory) -> None:
            self._uow_factory = uow_factory

        async def handle(self, command: RegisterOrganisationCommand) -> str:
            uow = self._uow_factory()
            async with uow:
                raise RuntimeError(f"boom:{command.name}")

    factory = FakeUnitOfWorkFactory()
    handler: CommandHandler[RegisterOrganisationCommand, str] = FailingHandler(factory)

    with pytest.raises(RuntimeError, match="boom:Acme"):
        await handler.handle(RegisterOrganisationCommand(name="Acme"))

    uow = factory.created[0]
    assert uow.entered is True
    assert uow.committed is False
    assert uow.rolled_back is True
    assert uow.exited is True


@pytest.mark.asyncio
async def test_query_handler_returns_projection() -> None:
    handler: QueryHandler[GetOrganisationQuery, OrganisationView | None] = GetOrganisationHandler(
        {"org-1": "Acme"}
    )

    found = await handler.handle(GetOrganisationQuery(organisation_id="org-1"))
    missing = await handler.handle(GetOrganisationQuery(organisation_id="missing"))

    assert found == OrganisationView(organisation_id="org-1", name="Acme")
    assert missing is None


@pytest.mark.asyncio
async def test_handlers_are_async_only() -> None:
    command_handler = RegisterOrganisationHandler(FakeUnitOfWorkFactory())
    query_handler = GetOrganisationHandler({})

    assert inspect.iscoroutinefunction(command_handler.handle)
    assert inspect.iscoroutinefunction(query_handler.handle)

    command_coro = command_handler.handle(RegisterOrganisationCommand(name="X"))
    query_coro = query_handler.handle(GetOrganisationQuery(organisation_id="x"))
    assert inspect.iscoroutine(command_coro)
    assert inspect.iscoroutine(query_coro)
    await command_coro
    await query_coro


# ---------------------------------------------------------------------------
# Layer purity
# ---------------------------------------------------------------------------


def _imported_modules(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                names.add(alias.name)
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            names.add(node.module)
    return names


@pytest.mark.parametrize("path", FOUNDATION_MODULES, ids=lambda p: p.name)
def test_foundation_modules_have_no_framework_or_infra_imports(path: Path) -> None:
    imported = _imported_modules(path)
    for name in imported:
        for prefix in FORBIDDEN_IMPORT_PREFIXES:
            assert not name.startswith(prefix), f"{path.name} imports {name}"


def test_foundation_modules_only_use_typing_and_stdlib_plus_application() -> None:
    allowed_prefixes = (
        "__future__",
        "typing",
        "types",
        "collections",
        "abc",
        "dataclasses",
        "easyid_api.application",
        "easyid_domain",
    )
    for path in FOUNDATION_MODULES:
        for name in _imported_modules(path):
            assert any(
                name == prefix or name.startswith(f"{prefix}.") for prefix in allowed_prefixes
            ), f"{path.name} unexpectedly imports {name}"


def test_command_handler_generic_args_are_typevars() -> None:
    # CommandHandler[TCommand, TResult] — origin is CommandHandler.
    assert get_origin(CommandHandler[RegisterOrganisationCommand, str]) is CommandHandler
    args = get_args(CommandHandler[RegisterOrganisationCommand, str])
    assert args == (RegisterOrganisationCommand, str)


def test_query_handler_generic_args_are_typevars() -> None:
    assert get_origin(QueryHandler[GetOrganisationQuery, OrganisationView | None]) is QueryHandler
    args = get_args(QueryHandler[GetOrganisationQuery, OrganisationView | None])
    assert args[0] is GetOrganisationQuery
    assert args[1] == OrganisationView | None


def test_concrete_commands_and_queries_are_usable_as_protocol_bounds() -> None:
    """Frozen dataclasses satisfy the empty Command / Query marker Protocols."""

    def accept_command(command: Command) -> str:
        return type(command).__name__

    def accept_query(query: Query) -> str:
        return type(query).__name__

    assert accept_command(RegisterOrganisationCommand(name="Acme")) == (
        "RegisterOrganisationCommand"
    )
    assert accept_query(GetOrganisationQuery(organisation_id="org-1")) == "GetOrganisationQuery"


def test_handler_protocols_reject_sync_handle_at_type_level_documentation() -> None:
    """Document that handle must be async — source contains async def."""
    assert "async def handle" in inspect.getsource(CommandHandler)
    assert "async def handle" in inspect.getsource(QueryHandler)


@pytest.mark.asyncio
async def test_unit_of_work_factory_creates_independent_instances() -> None:
    factory: UnitOfWorkFactory = FakeUnitOfWorkFactory()
    first = factory()
    second = factory()
    assert first is not second
    async with first:
        await first.commit()
    async with second:
        await second.rollback()
    assert isinstance(first, FakeUnitOfWork)
    assert isinstance(second, FakeUnitOfWork)
    assert first.committed is True
    assert second.rolled_back is True
