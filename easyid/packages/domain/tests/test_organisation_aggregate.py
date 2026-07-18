"""Tests for DOM-001.3 Organisation aggregate."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from easyid_domain.kernel.clock import FixedClock
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationStatus,
)
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


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(datetime(2026, 7, 18, 12, 0, tzinfo=UTC))


@pytest.fixture
def name() -> OrganisationName:
    return OrganisationName("Acme Pty Ltd")


def test_register_creates_active_organisation(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)

    assert isinstance(organisation.id, OrganisationId)
    assert organisation.name == name
    assert organisation.status is OrganisationStatus.ACTIVE
    assert organisation.version == 1
    assert organisation.created_at == clock.now()
    assert organisation.updated_at == clock.now()
    assert hasattr(Organisation, "__slots__")

    events = organisation.collect_events()
    assert len(events) == 1
    event = events[0]
    assert isinstance(event, OrganisationRegistered)
    assert event.organisation_id == organisation.id
    assert event.name == name


def test_rename_updates_name_and_raises_event(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.collect_events()
    clock.advance(minutes=5)
    new_name = OrganisationName("Acme Group")

    organisation.rename(new_name, clock=clock)

    assert organisation.name == new_name
    assert organisation.updated_at == clock.now()
    assert organisation.created_at < organisation.updated_at

    events = organisation.collect_events()
    assert len(events) == 1
    event = events[0]
    assert isinstance(event, OrganisationRenamed)
    assert event.old_name == name
    assert event.new_name == new_name
    assert event.organisation_id == organisation.id


def test_rename_rejects_unchanged_name(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.collect_events()

    with pytest.raises(OrganisationNameUnchanged):
        organisation.rename(OrganisationName("Acme Pty Ltd"), clock=clock)

    assert len(organisation.collect_events()) == 0


def test_rename_rejects_when_suspended(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.suspend(clock=clock)
    organisation.collect_events()

    with pytest.raises(OrganisationIsSuspended):
        organisation.rename(OrganisationName("Other"), clock=clock)

    assert organisation.name == name
    assert len(organisation.collect_events()) == 0


def test_suspend_transitions_to_suspended(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.collect_events()
    clock.advance(hours=1)

    organisation.suspend(clock=clock)

    assert organisation.status is OrganisationStatus.SUSPENDED
    assert organisation.updated_at == clock.now()
    events = organisation.collect_events()
    assert len(events) == 1
    assert isinstance(events[0], OrganisationSuspended)
    assert events[0].organisation_id == organisation.id


def test_suspend_rejects_when_already_suspended(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.suspend(clock=clock)
    organisation.collect_events()

    with pytest.raises(OrganisationAlreadySuspended):
        organisation.suspend(clock=clock)

    assert len(organisation.collect_events()) == 0


def test_reactivate_transitions_to_active(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.suspend(clock=clock)
    organisation.collect_events()
    clock.advance(days=1)

    organisation.reactivate(clock=clock)

    assert organisation.status is OrganisationStatus.ACTIVE
    assert organisation.updated_at == clock.now()
    events = organisation.collect_events()
    assert len(events) == 1
    assert isinstance(events[0], OrganisationReactivated)
    assert events[0].organisation_id == organisation.id


def test_reactivate_rejects_when_already_active(
    clock: FixedClock,
    name: OrganisationName,
) -> None:
    organisation = Organisation.register(name, clock=clock)
    organisation.collect_events()

    with pytest.raises(OrganisationAlreadyActive):
        organisation.reactivate(clock=clock)

    assert len(organisation.collect_events()) == 0


def test_identity_equality(clock: FixedClock, name: OrganisationName) -> None:
    left = Organisation.register(name, clock=clock)
    right = Organisation(
        id=left.id,
        name=OrganisationName("Other"),
        status=OrganisationStatus.ACTIVE,
        created_at=left.created_at,
        updated_at=left.updated_at,
        version=1,
    )
    assert left == right
    assert hash(left) == hash(right)


def test_id_is_immutable(clock: FixedClock, name: OrganisationName) -> None:
    organisation = Organisation.register(name, clock=clock)
    with pytest.raises(AttributeError, match="immutable"):
        organisation.id = OrganisationId.generate()
