"""Aggregate root — consistency boundary that collects domain events."""

from __future__ import annotations

from dataclasses import dataclass, field

from easyid_domain.kernel.domain_event import DomainEvent
from easyid_domain.kernel.entity import Entity


@dataclass(eq=False, slots=True)
class AggregateRoot[TId](Entity[TId]):
    """
    Entry point to an aggregate consistency boundary.

    Manages a list of pending `DomainEvent` instances raised during command
    handling. Application services should `collect_events()` after a
    successful commit (or clear them on failure).
    """

    _pending_events: list[DomainEvent] = field(
        default_factory=list,
        init=False,
        repr=False,
        compare=False,
    )

    def raise_event(self, event: DomainEvent) -> None:
        """Record a domain event to be dispatched later."""
        self._pending_events.append(event)

    @property
    def pending_events(self) -> tuple[DomainEvent, ...]:
        """Return a snapshot of events not yet collected."""
        return tuple(self._pending_events)

    def collect_events(self) -> tuple[DomainEvent, ...]:
        """Return and clear all pending events."""
        events = tuple(self._pending_events)
        self._pending_events.clear()
        return events

    def clear_events(self) -> None:
        """Discard pending events without returning them."""
        self._pending_events.clear()
