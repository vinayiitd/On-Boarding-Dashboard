"""Tests for Get Organisation By ID application query."""

from __future__ import annotations

import ast
from datetime import UTC, datetime
from pathlib import Path
from typing import get_type_hints

import pytest

from easyid_api.application.organisation.errors import OrganisationNotFound
from easyid_api.application.organisation.queries.get_by_id import (
    GetOrganisationByIdHandler,
    GetOrganisationByIdQuery,
    GetOrganisationByIdResult,
)
from easyid_api.application.queries import QueryHandler
from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationRepository,
    OrganisationStatus,
)


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


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 25, 12, 0, tzinfo=UTC))


@pytest.fixture
def repository() -> FakeOrganisationRepository:
    return FakeOrganisationRepository()


@pytest.fixture
def organisation(
    clock: FixedClock,
    repository: FakeOrganisationRepository,
) -> Organisation:
    org = Organisation.register(OrganisationName("Acme Pty Ltd"), clock=clock)
    org.collect_events()
    repository._store[org.id] = org
    return org


@pytest.fixture
def handler(repository: FakeOrganisationRepository) -> GetOrganisationByIdHandler:
    return GetOrganisationByIdHandler(repository)


@pytest.mark.asyncio
async def test_organisation_successfully_returned(
    handler: GetOrganisationByIdHandler,
    organisation: Organisation,
) -> None:
    result = await handler.handle(GetOrganisationByIdQuery(organisation_id=organisation.id))

    assert isinstance(result, GetOrganisationByIdResult)
    assert result.organisation_id == organisation.id
    assert result.name == "Acme Pty Ltd"
    assert result.status is OrganisationStatus.ACTIVE
    assert result.version == 1


@pytest.mark.asyncio
async def test_repository_get_by_id_called_once(
    handler: GetOrganisationByIdHandler,
    organisation: Organisation,
    repository: FakeOrganisationRepository,
) -> None:
    await handler.handle(GetOrganisationByIdQuery(organisation_id=organisation.id))
    assert repository.get_by_id_calls == 1


@pytest.mark.asyncio
async def test_organisation_not_found_when_missing(
    handler: GetOrganisationByIdHandler,
    repository: FakeOrganisationRepository,
) -> None:
    missing_id = OrganisationId.generate()

    with pytest.raises(OrganisationNotFound) as exc_info:
        await handler.handle(GetOrganisationByIdQuery(organisation_id=missing_id))

    assert exc_info.value.organisation_id == missing_id
    assert repository.get_by_id_calls == 1


@pytest.mark.asyncio
async def test_returned_projection_contains_expected_values(
    handler: GetOrganisationByIdHandler,
    organisation: Organisation,
    clock: FixedClock,
) -> None:
    organisation.rename(OrganisationName("Acme Group"), clock=clock)
    organisation.collect_events()

    result = await handler.handle(GetOrganisationByIdQuery(organisation_id=organisation.id))

    assert result == GetOrganisationByIdResult(
        organisation_id=organisation.id,
        name="Acme Group",
        status=OrganisationStatus.ACTIVE,
        version=organisation.version,
    )
    assert type(result) is GetOrganisationByIdResult


@pytest.mark.asyncio
async def test_no_persistence_methods_are_called(
    handler: GetOrganisationByIdHandler,
    organisation: Organisation,
    repository: FakeOrganisationRepository,
) -> None:
    await handler.handle(GetOrganisationByIdQuery(organisation_id=organisation.id))

    assert repository.save_calls == 0
    assert repository.get_by_id_calls == 1


def test_no_unit_of_work_is_used() -> None:
    path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "easyid_api"
        / "application"
        / "organisation"
        / "queries"
        / "get_by_id.py"
    )
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imported: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imported.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            imported.add(node.module)

    assert not any("unit_of_work" in name for name in imported)
    source = path.read_text(encoding="utf-8")
    assert "UnitOfWorkFactory" not in source
    assert "easyid_api.application.unit_of_work" not in source


def test_handler_constructor_depends_only_on_repository() -> None:
    hints = get_type_hints(GetOrganisationByIdHandler.__init__)
    assert set(hints) == {"organisations", "return"}
    assert hints["organisations"] is OrganisationRepository


def test_handler_satisfies_query_handler_protocol(
    handler: GetOrganisationByIdHandler,
) -> None:
    typed: QueryHandler[GetOrganisationByIdQuery, GetOrganisationByIdResult] = handler
    assert callable(typed.handle)


def test_query_and_result_are_frozen_and_slotted() -> None:
    query = GetOrganisationByIdQuery(organisation_id=OrganisationId.generate())
    with pytest.raises(AttributeError):
        query.organisation_id = OrganisationId.generate()  # type: ignore[misc]
    assert hasattr(GetOrganisationByIdQuery, "__slots__")

    result = GetOrganisationByIdResult(
        organisation_id=OrganisationId.generate(),
        name="Acme",
        status=OrganisationStatus.ACTIVE,
        version=1,
    )
    with pytest.raises(AttributeError):
        result.name = "Other"  # type: ignore[misc]
    assert hasattr(GetOrganisationByIdResult, "__slots__")


def test_fake_repository_satisfies_protocol(
    repository: FakeOrganisationRepository,
) -> None:
    assert isinstance(repository, OrganisationRepository)
