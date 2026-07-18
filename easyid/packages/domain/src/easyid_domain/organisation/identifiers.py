"""Organisation identity types."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_domain.kernel.identity import Identifier


@dataclass(frozen=True, slots=True)
class OrganisationId(Identifier):
    """Unique identifier for an organisation."""
