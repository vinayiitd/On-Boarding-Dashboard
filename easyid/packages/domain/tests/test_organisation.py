"""Tests for DOM-001.1 organisation foundational types."""

from __future__ import annotations

from uuid import uuid4

import pytest

from easyid_domain.organisation import (
    OrganisationId,
    OrganisationName,
    OrganisationStatus,
)
from easyid_domain.organisation.errors import (
    OrganisationNameEmpty,
    OrganisationNameTooLong,
)

# --- OrganisationId -----------------------------------------------------------


def test_organisation_id_generate() -> None:
    org_id = OrganisationId.generate()
    assert isinstance(org_id, OrganisationId)
    assert org_id.value.version == 4


def test_organisation_id_from_str_roundtrip() -> None:
    raw = str(uuid4())
    org_id = OrganisationId.from_str(raw)
    assert str(org_id) == raw
    assert OrganisationId.from_str(str(org_id)) == org_id


def test_organisation_id_equality_and_hash() -> None:
    shared = uuid4()
    left = OrganisationId(value=shared)
    right = OrganisationId(value=shared)
    other = OrganisationId(value=uuid4())

    assert left == right
    assert hash(left) == hash(right)
    assert left != other
    assert hash(left) != hash(other)


# --- OrganisationName ---------------------------------------------------------


def test_organisation_name_trims_whitespace() -> None:
    name = OrganisationName("  ABC Pty Ltd  ")
    assert name.value == "ABC Pty Ltd"


def test_organisation_name_preserves_casing_and_punctuation() -> None:
    name = OrganisationName("  McDonald's & Co.  ")
    assert name.value == "McDonald's & Co."


def test_organisation_name_rejects_empty() -> None:
    with pytest.raises(OrganisationNameEmpty):
        OrganisationName("")


def test_organisation_name_rejects_whitespace_only() -> None:
    with pytest.raises(OrganisationNameEmpty):
        OrganisationName("   \t  ")


def test_organisation_name_rejects_too_long() -> None:
    with pytest.raises(OrganisationNameTooLong) as exc_info:
        OrganisationName("x" * 201)
    assert exc_info.value.details["length"] == 201
    assert exc_info.value.details["max_length"] == 200


def test_organisation_name_accepts_max_length() -> None:
    name = OrganisationName("x" * 200)
    assert len(name.value) == 200


def test_organisation_name_equality() -> None:
    left = OrganisationName("  Acme  ")
    right = OrganisationName("Acme")
    assert left == right
    assert hash(left) == hash(right)


def test_organisation_name_is_immutable() -> None:
    name = OrganisationName("Acme")
    with pytest.raises(AttributeError):
        name.value = "Other"  # type: ignore[misc]


# --- OrganisationStatus -------------------------------------------------------


def test_organisation_status_values() -> None:
    assert OrganisationStatus.ACTIVE.value == "active"
    assert OrganisationStatus.SUSPENDED.value == "suspended"
    assert set(OrganisationStatus) == {
        OrganisationStatus.ACTIVE,
        OrganisationStatus.SUSPENDED,
    }


def test_organisation_status_string_serialization() -> None:
    assert str(OrganisationStatus.ACTIVE) == "active"
    assert str(OrganisationStatus.SUSPENDED) == "suspended"
    assert OrganisationStatus("active") is OrganisationStatus.ACTIVE
    assert OrganisationStatus("suspended") is OrganisationStatus.SUSPENDED
