"""Clock abstraction — testable time for the domain."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Protocol, runtime_checkable


@runtime_checkable
class Clock(Protocol):
    """
    Source of "now" for domain logic.

    Inject a `Clock` into aggregates/services that need timestamps so tests
    can freeze time with `FixedClock`.
    """

    def now(self) -> datetime:
        """Return the current instant as an aware UTC datetime."""
        ...


class SystemClock:
    """Production clock backed by the system UTC clock."""

    def now(self) -> datetime:
        return datetime.now(UTC)


class FixedClock:
    """Deterministic clock for tests — always returns the configured instant."""

    def __init__(self, instant: datetime) -> None:
        if instant.tzinfo is None:
            msg = "FixedClock requires a timezone-aware datetime"
            raise ValueError(msg)
        self._instant = instant.astimezone(UTC)

    def now(self) -> datetime:
        return self._instant

    def advance(self, **kwargs: float) -> None:
        """
        Advance the fixed instant by `timedelta` keywords.

        Example: `clock.advance(hours=1)` — kwargs are passed to
        `datetime.timedelta`.
        """
        self._instant = self._instant + timedelta(**kwargs)
