"""Tests for DOM-001.4 OrganisationRepository protocol."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import get_type_hints

import pytest

from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationRepository,
)
from easyid_domain.organisation.repository import OrganisationRepository as RepositoryFromModule


class InMemoryOrganisationRepository:
    """Minimal async store used only to validate protocol conformance."""

    def __init__(self) -> None:
        self._store: dict[OrganisationId, Organisation] = {}

    async def get_by_id(self, organisation_id: OrganisationId) -> Organisation | None:
        return self._store.get(organisation_id)

    async def save(self, organisation: Organisation) -> None:
        self._store[organisation.id] = organisation


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 18, 12, 0, tzinfo=UTC))


@pytest.fixture
def repository() -> InMemoryOrganisationRepository:
    return InMemoryOrganisationRepository()


def test_in_memory_repository_conforms_to_protocol(
    repository: InMemoryOrganisationRepository,
) -> None:
    assert isinstance(repository, OrganisationRepository)
    assert OrganisationRepository is RepositoryFromModule


def test_protocol_exposes_async_aggregate_methods_only() -> None:
    hints = get_type_hints(OrganisationRepository.get_by_id)
    assert hints["organisation_id"] is OrganisationId
    assert hints["return"] == Organisation | None

    save_hints = get_type_hints(OrganisationRepository.save)
    assert save_hints["organisation"] is Organisation
    assert save_hints["return"] is type(None)

    method_names = {
        name
        for name, value in vars(OrganisationRepository).items()
        if callable(value) and not name.startswith("_")
    }
    assert method_names == {"get_by_id", "save"}
    for forbidden in ("insert", "update", "delete", "remove"):
        assert forbidden not in method_names


def test_save_and_get_by_id_round_trip(
    repository: InMemoryOrganisationRepository,
    clock: FixedClock,
) -> None:
    organisation = Organisation.register(OrganisationName("Acme Pty Ltd"), clock=clock)

    async def exercise() -> Organisation | None:
        await repository.save(organisation)
        return await repository.get_by_id(organisation.id)

    loaded = asyncio.run(exercise())

    assert loaded is organisation
    assert isinstance(loaded, Organisation)


def test_get_by_id_returns_none_when_missing(
    repository: InMemoryOrganisationRepository,
) -> None:
    assert asyncio.run(repository.get_by_id(OrganisationId.generate())) is None
