"""Entity base — identity-based equality."""

from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar


@dataclass(eq=False)
class Entity[TId]:
    """
    An object defined by identity, not by its attributes.

    Two entities of the same concrete type are equal when their `id` values
    are equal, regardless of other field differences. Subclasses should use
    `@dataclass(eq=False)` (or inherit this base) and must not restore
    value-based equality.
    """

    id: TId

    # Marker for isinstance checks without importing SQLAlchemy/Pydantic.
    __domain_entity__: ClassVar[bool] = True

    def __eq__(self, other: object) -> bool:
        if other is self:
            return True
        if not isinstance(other, Entity):
            return NotImplemented
        if type(self) is not type(other):
            return False
        return bool(self.id == other.id)

    def __hash__(self) -> int:
        return hash((type(self), self.id))

    def __repr__(self) -> str:
        return f"{type(self).__name__}(id={self.id!r})"
