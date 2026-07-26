"""Unit tests for SqlAlchemyOrganisationRepository (no database required)."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from easyid_api.infrastructure.persistence.mappings.organisation import (
    OrganisationModel,
    from_domain,
)
from easyid_api.infrastructure.persistence.repositories.organisation import (
    SqlAlchemyOrganisationRepository,
)
from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationRepository,
    OrganisationStatus,
)


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 26, 12, 0, tzinfo=UTC))


@pytest.fixture
def organisation(clock: FixedClock) -> Organisation:
    org = Organisation.register(OrganisationName("Acme Pty Ltd"), clock=clock)
    org.collect_events()
    return org


@pytest.fixture
def session() -> MagicMock:
    mock = MagicMock()
    mock.get = AsyncMock(return_value=None)
    mock.add = MagicMock()
    mock.commit = MagicMock()
    mock.rollback = MagicMock()
    mock.flush = MagicMock()
    mock.close = MagicMock()
    mock.begin = MagicMock()
    return mock


@pytest.fixture
def repository(session: MagicMock) -> SqlAlchemyOrganisationRepository:
    return SqlAlchemyOrganisationRepository(session)


def test_implements_organisation_repository_protocol(
    repository: SqlAlchemyOrganisationRepository,
) -> None:
    assert isinstance(repository, OrganisationRepository)


@pytest.mark.asyncio
async def test_get_by_id_returns_none_when_missing(
    repository: SqlAlchemyOrganisationRepository,
    session: MagicMock,
) -> None:
    organisation_id = OrganisationId.generate()
    session.get = AsyncMock(return_value=None)

    result = await repository.get_by_id(organisation_id)

    assert result is None
    session.get.assert_awaited_once()
    assert session.get.await_args.args[0] is OrganisationModel
    assert session.get.await_args.args[1] == organisation_id.value


@pytest.mark.asyncio
async def test_get_by_id_returns_aggregate(
    repository: SqlAlchemyOrganisationRepository,
    session: MagicMock,
    organisation: Organisation,
) -> None:
    session.get = AsyncMock(return_value=from_domain(organisation))

    result = await repository.get_by_id(organisation.id)

    assert result is not None
    assert result.id == organisation.id
    assert result.name == organisation.name
    assert result.status is OrganisationStatus.ACTIVE
    assert result.version == organisation.version
    assert result.pending_events == ()


@pytest.mark.asyncio
async def test_save_inserts_when_missing(
    repository: SqlAlchemyOrganisationRepository,
    session: MagicMock,
    organisation: Organisation,
) -> None:
    session.get = AsyncMock(return_value=None)

    await repository.save(organisation)

    session.add.assert_called_once()
    added = session.add.call_args.args[0]
    assert isinstance(added, OrganisationModel)
    assert added.id == organisation.id.value
    assert added.name == "Acme Pty Ltd"
    assert added.status == OrganisationStatus.ACTIVE.value
    session.commit.assert_not_called()
    session.flush.assert_not_called()
    session.rollback.assert_not_called()


@pytest.mark.asyncio
async def test_save_updates_existing_row_in_place(
    repository: SqlAlchemyOrganisationRepository,
    session: MagicMock,
    organisation: Organisation,
    clock: FixedClock,
) -> None:
    existing = from_domain(organisation)
    original_created_at = existing.created_at
    session.get = AsyncMock(return_value=existing)

    clock.advance(minutes=10)
    organisation.rename(OrganisationName("Acme Group"), clock=clock)
    organisation.collect_events()

    await repository.save(organisation)

    session.add.assert_not_called()
    assert existing.name == "Acme Group"
    assert existing.status == OrganisationStatus.ACTIVE.value
    assert existing.version == organisation.version
    assert existing.updated_at == organisation.updated_at
    assert existing.created_at == original_created_at
    session.commit.assert_not_called()
    session.flush.assert_not_called()
    session.rollback.assert_not_called()


@pytest.mark.asyncio
async def test_repository_never_manages_transactions(
    repository: SqlAlchemyOrganisationRepository,
    session: MagicMock,
    organisation: Organisation,
) -> None:
    session.get = AsyncMock(return_value=None)
    await repository.get_by_id(organisation.id)
    await repository.save(organisation)

    session.commit.assert_not_called()
    session.rollback.assert_not_called()
    session.flush.assert_not_called()
    session.close.assert_not_called()
    session.begin.assert_not_called()
