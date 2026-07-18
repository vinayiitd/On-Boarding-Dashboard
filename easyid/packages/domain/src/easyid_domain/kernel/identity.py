"""
Identifier utilities.

IDs are opaque UUIDs. Generation is centralized in `new_id()` so the
strategy can move to UUIDv7 later without touching call sites.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Self
from uuid import UUID, uuid4

# Bump when the generator strategy changes (ops / debugging aid).
ID_STRATEGY: str = "uuid4"


def new_id() -> UUID:
    """
    Return a new opaque identifier.

    Currently UUID4. Replace the body with UUIDv7 when the runtime supports
    it (Python 3.14+ `uuid.uuid7` or an approved library).
    """
    return uuid4()


def parse_id(value: str) -> UUID:
    """Parse a UUID string; raises `ValueError` on malformed input."""
    return UUID(value)


@dataclass(frozen=True, slots=True, order=True)
class Identifier:
    """
    Typed identity value object.

    Subclass to brand ids per aggregate (e.g. `class OrderId(Identifier):
    ...`) so they are not interchangeable at the type level when annotated
    explicitly, while remaining value-equal by UUID.
    """

    value: UUID

    @classmethod
    def generate(cls) -> Self:
        """Create a new identifier using `new_id()`."""
        return cls(new_id())

    @classmethod
    def from_str(cls, value: str) -> Self:
        """Parse from a UUID string."""
        return cls(parse_id(value))

    def __str__(self) -> str:
        return str(self.value)
