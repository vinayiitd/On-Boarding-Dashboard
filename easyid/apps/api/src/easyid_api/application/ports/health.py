"""Database health port — readiness probe for the persistence layer."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol


@dataclass(frozen=True, slots=True)
class DatabaseHealthStatus:
    """Result of a single database health probe."""

    status: Literal["up", "down"]
    detail: str | None = None


class DatabaseHealth(Protocol):
    """Probe whether the database is reachable and accepting queries."""

    async def check(self) -> DatabaseHealthStatus:
        """Run a lightweight connectivity check (e.g. `SELECT 1`)."""
        ...
