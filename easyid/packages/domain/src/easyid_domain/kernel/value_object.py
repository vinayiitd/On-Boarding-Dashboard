"""Value object base — value-based equality via frozen dataclass."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ValueObject:
    """
    An immutable object defined by its attributes.

    Equality and hashing come from the frozen dataclass: two instances with
    the same field values are equal. Subclasses should remain frozen and
    override `_validate()` for invariant checks (called from `__post_init__`).
    """

    def __post_init__(self) -> None:
        self._validate()

    def _validate(self) -> None:
        """Hook for subclass invariants. Raise `DomainError` on violation."""
        return None
