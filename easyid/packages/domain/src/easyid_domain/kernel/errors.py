"""
Domain error hierarchy.

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
        return hash((type(self), self.code, self.message))


class ValidationError(DomainError):
    """Input or state failed a domain validation rule."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "validation_error",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class InvariantViolationError(DomainError):
    """An aggregate or entity invariant was broken."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "invariant_violation",
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)
