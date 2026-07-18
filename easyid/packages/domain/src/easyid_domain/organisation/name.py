"""Organisation name value object."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_domain.kernel.value_object import ValueObject
from easyid_domain.organisation.errors import (
    OrganisationNameEmpty,
    OrganisationNameTooLong,
)

_MAX_LENGTH = 200


@dataclass(frozen=True, slots=True)
class OrganisationName(ValueObject):
    """
    Display name of an organisation.

    Leading and trailing whitespace are trimmed on construction. Casing and
    punctuation are preserved. Empty or overlong names are rejected.
    """

    value: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "value", self.value.strip())
        self._validate()

    def _validate(self) -> None:
        if not self.value:
            raise OrganisationNameEmpty()
        if len(self.value) > _MAX_LENGTH:
            raise OrganisationNameTooLong(length=len(self.value))
