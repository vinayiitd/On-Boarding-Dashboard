"""
Domain error hierarchy.

Keep this set small and generic. Bounded contexts define richer errors
(e.g. `DuplicateAbn`) by subclassing `BusinessRuleViolation` next to their
aggregates — not here.

Preferred payload for `Result.Err` when modelling expected business
failures. Also subclasses `Exception` so callers may raise them when an
invariant must abort the current flow.
"""

from __future__ import annotations

from collections.abc import Mapping
from types import MappingProxyType
from typing import Any


class DomainError(Exception):
    """
    Base domain failure.

    `code` is a stable machine-readable identifier; `message` is human-
    readable. `details` carries optional structured context (immutable).
    Values in `details` must be hashable if the error is used in a set or
    as a dict key — they contribute to both equality and the hash.
    """

    __slots__ = ("code", "details", "message")

    code: str
    message: str
    details: Mapping[str, Any]

    def __init__(
        self,
        message: str,
        *,
        code: str = "domain_error",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.details = MappingProxyType(dict(details or {}))
        super().__init__(message)

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"

    def __repr__(self) -> str:
        return (
            f"{type(self).__name__}(code={self.code!r}, message={self.message!r}, "
            f"details={dict(self.details)!r})"
        )

    def __eq__(self, other: object) -> bool:
        if other is self:
            return True
        if not isinstance(other, DomainError):
            return NotImplemented
        return (
            type(self) is type(other)
            and self.code == other.code
            and self.message == other.message
            and dict(self.details) == dict(other.details)
        )

    def __hash__(self) -> int:
        return hash(
            (
                type(self),
                self.code,
                self.message,
                tuple(sorted(self.details.items())),
            )
        )


class InvariantViolation(DomainError):
    """An aggregate or entity invariant was broken."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "invariant_violation",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class BusinessRuleViolation(DomainError):
    """
    A business rule failed.

    Subclass in the owning bounded context with ubiquitous-language names
    (e.g. `DuplicateAbn`, `OrganisationSuspended`).
    """

    def __init__(
        self,
        message: str,
        *,
        code: str = "business_rule_violation",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class InvalidValue(DomainError):
    """A value object or primitive failed domain validation."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "invalid_value",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)
