"""Domain event base — immutable facts that occurred in the domain."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from easyid_domain.kernel.identity import new_id


@dataclass(frozen=True, slots=True, kw_only=True)
class DomainEvent:
    """
    Immutable record of something that happened in the domain.

    Subclass with additional frozen fields for event payloads. Aggregates
    raise events via `AggregateRoot.raise_event`; application handlers
    dispatch collected events after a successful unit of work.
    """

    event_id: UUID = field(default_factory=new_id)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def event_type(self) -> str:
        """Stable type name for routing / serialization."""
        return type(self).__qualname__
