"""Entity base — identity-based equality."""

from __future__ import annotations

from abc import ABC
from dataclasses import dataclass
from typing import ClassVar, Self


@dataclass(eq=False, slots=True)
class Entity[TId](ABC):
    """
    An object defined by identity, not by its attributes.

    Abstract — subclass before use. Two entities of the same concrete type
    are equal when their `id` values are equal, regardless of other field
    differences. The `id` is fixed after construction.

    Subclasses should use `@dataclass(eq=False)` (or inherit this base) and
    must not restore value-based equality.
    """

    id: TId

    # Marker for isinstance checks without importing SQLAlchemy/Pydantic.
    __domain_entity__: ClassVar[bool] = True

    def __new__(cls, *_args: object, **_kwargs: object) -> Self:
        if cls is Entity:
            msg = "Entity cannot be instantiated directly; subclass it"
            raise TypeError(msg)
        return super().__new__(cls)

    def __setattr__(self, name: str, value: object) -> None:
        if name == "id":
            try:
                object.__getattribute__(self, "id")
            except AttributeError:
                pass
            else:
                msg = "Entity id is immutable after construction"
                raise AttributeError(msg)
        super().__setattr__(name, value)

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
