"""Organisation lifecycle status."""

from __future__ import annotations

from enum import StrEnum


class OrganisationStatus(StrEnum):
    """Whether an organisation is currently active or suspended."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
