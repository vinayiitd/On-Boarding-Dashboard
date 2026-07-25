"""Unit tests for Organisation ORM mapping (no database required)."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from easyid_api.infrastructure.persistence.mappings import (
    OrganisationModel as ExportedOrganisationModel,
)
from easyid_api.infrastructure.persistence.mappings.organisation import (
    OrganisationModel,
    from_domain,
    to_domain,
)
from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationStatus,
)


def test_from_domain_and_to_domain_round_trip() -> None:
    clock = FixedClock(datetime(2026, 7, 25, 12, 0, tzinfo=UTC))
    organisation = Organisation.register(OrganisationName("Acme Pty Ltd"), clock=clock)
    organisation.collect_events()

    model = from_domain(organisation)
    assert isinstance(model, OrganisationModel)
    assert model.id == organisation.id.value
    assert model.name == "Acme Pty Ltd"
    assert model.status == OrganisationStatus.ACTIVE.value
    assert model.version == 1
    assert model.created_at == clock.now()
    assert model.updated_at == clock.now()

    restored = to_domain(model)
    assert restored.id == organisation.id
    assert restored.name == organisation.name
    assert restored.status is OrganisationStatus.ACTIVE
    assert restored.version == organisation.version
    assert restored.created_at == organisation.created_at
    assert restored.updated_at == organisation.updated_at
    assert restored.pending_events == ()


def test_to_domain_maps_suspended_status() -> None:
    model = OrganisationModel(
        id=OrganisationId.generate().value,
        name="Acme",
        status=OrganisationStatus.SUSPENDED.value,
        version=3,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        updated_at=datetime(2026, 2, 1, tzinfo=UTC),
    )

    organisation = to_domain(model)
    assert organisation.status is OrganisationStatus.SUSPENDED
    assert organisation.version == 3
    assert organisation.name == OrganisationName("Acme")


def test_organisation_model_tablename() -> None:
    assert OrganisationModel.__tablename__ == "organisations"


def test_mappings_package_exports_organisation_model() -> None:
    assert ExportedOrganisationModel is OrganisationModel


def test_to_domain_uses_rehydrate(monkeypatch: pytest.MonkeyPatch) -> None:
    spy = MagicMock(wraps=Organisation.rehydrate)
    monkeypatch.setattr(Organisation, "rehydrate", spy)

    model = OrganisationModel(
        id=OrganisationId.generate().value,
        name="Acme",
        status=OrganisationStatus.ACTIVE.value,
        version=2,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        updated_at=datetime(2026, 2, 1, tzinfo=UTC),
    )

    organisation = to_domain(model)

    spy.assert_called_once()
    assert organisation.id.value == model.id
    assert organisation.pending_events == ()
