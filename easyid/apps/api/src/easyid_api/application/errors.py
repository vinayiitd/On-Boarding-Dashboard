"""
Application-layer errors.

These are Result.Err payloads for use-case / repository outcomes — not domain
invariants. Domain rules use `easyid_domain.DomainError` subclasses instead.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class EntityNotFound:
    """
    A repository lookup did not find the requested entity.

    Flow: application → repository → `Result.Err(EntityNotFound)`.
    """

    entity_type: str
    entity_id: Any
    message: str | None = None

    @property
    def code(self) -> str:
        return "entity_not_found"

    def __str__(self) -> str:
        detail = self.message or f"{self.entity_type} not found"
        return f"[{self.code}] {detail} (id={self.entity_id!r})"
