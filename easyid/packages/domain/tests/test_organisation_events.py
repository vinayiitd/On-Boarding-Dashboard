"""Tests for DOM-001.2 organisation domain events."""

from __future__ import annotations

from dataclasses import fields

import pytest

from easyid_domain.organisation.events import (
    OrganisationReactivated,
    OrganisationRegistered,
    OrganisationRenamed,
    OrganisationSuspended,
)
from easyid_domain.organisation.identifiers import OrganisationId
from easyid_domain.organisation.name import OrganisationName


@pytest.fixture
def organisation_id() -> OrganisationId:
    return OrganisationId.generate()


@pytest.fixture
def name() -> OrganisationName:
    return OrganisationName("Acme Pty Ltd")


def test_organisation_registered_payload(
    organisation_id: OrganisationId,
    name: OrganisationName,
) -> None:
    event = OrganisationRegistered(organisation_id=organisation_id, name=name)

    assert event.organisation_id == organisation_id
    assert event.name == name
    assert event.event_type == "OrganisationRegistered"
    assert event.event_id is not None
    assert event.occurred_at is not None


def test_organisation_renamed_payload(organisation_id: OrganisationId) -> None:
    old_name = OrganisationName("Acme")
    new_name = OrganisationName("Acme Group")
    event = OrganisationRenamed(
        organisation_id=organisation_id,
        old_name=old_name,
        new_name=new_name,
    )

    assert event.organisation_id == organisation_id
    assert event.old_name == old_name
    assert event.new_name == new_name
    assert event.event_type == "OrganisationRenamed"


def test_organisation_suspended_payload(organisation_id: OrganisationId) -> None:
    event = OrganisationSuspended(organisation_id=organisation_id)

    assert event.organisation_id == organisation_id
    assert event.event_type == "OrganisationSuspended"


def test_organisation_reactivated_payload(organisation_id: OrganisationId) -> None:
    event = OrganisationReactivated(organisation_id=organisation_id)

    assert event.organisation_id == organisation_id
    assert event.event_type == "OrganisationReactivated"


def test_events_are_immutable(
    organisation_id: OrganisationId,
    name: OrganisationName,
) -> None:
    registered = OrganisationRegistered(organisation_id=organisation_id, name=name)
    renamed = OrganisationRenamed(
        organisation_id=organisation_id,
        old_name=name,
        new_name=OrganisationName("Other"),
    )
    suspended = OrganisationSuspended(organisation_id=organisation_id)
    reactivated = OrganisationReactivated(organisation_id=organisation_id)

    with pytest.raises(AttributeError):
        registered.name = OrganisationName("Nope")  # type: ignore[misc]
    with pytest.raises(AttributeError):
        renamed.new_name = OrganisationName("Nope")  # type: ignore[misc]
    with pytest.raises(AttributeError):
        suspended.organisation_id = OrganisationId.generate()  # type: ignore[misc]
    with pytest.raises(AttributeError):
        reactivated.organisation_id = OrganisationId.generate()  # type: ignore[misc]


def test_events_equality_by_value(
    organisation_id: OrganisationId,
    name: OrganisationName,
) -> None:
    left = OrganisationSuspended(organisation_id=organisation_id)
    right = OrganisationSuspended(
        organisation_id=organisation_id,
        event_id=left.event_id,
        occurred_at=left.occurred_at,
    )
    different = OrganisationSuspended(organisation_id=OrganisationId.generate())

    assert left == right
    assert hash(left) == hash(right)
    assert left != different

    registered_a = OrganisationRegistered(
        organisation_id=organisation_id,
        name=name,
        event_id=left.event_id,
        occurred_at=left.occurred_at,
    )
    registered_b = OrganisationRegistered(
        organisation_id=organisation_id,
        name=name,
        event_id=left.event_id,
        occurred_at=left.occurred_at,
    )
    assert registered_a == registered_b


def test_events_use_slots() -> None:
    for event_cls in (
        OrganisationRegistered,
        OrganisationRenamed,
        OrganisationSuspended,
        OrganisationReactivated,
    ):
        assert hasattr(event_cls, "__slots__")
        # Payload fields are present as dataclass fields.
        names = {f.name for f in fields(event_cls)}
        assert "organisation_id" in names
        assert "event_id" in names
        assert "occurred_at" in names
