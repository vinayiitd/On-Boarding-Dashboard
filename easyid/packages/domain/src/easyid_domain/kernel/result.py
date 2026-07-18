"""
Result — success/failure without exceptions for expected outcomes.

Use `ok(value)` / `err(error)` at domain and application boundaries.
Reserve exceptions for truly unexpected failures.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import NoReturn


@dataclass(frozen=True, slots=True)
class Ok[T]:
    """Successful result carrying `value`."""

    value: T

    def is_ok(self) -> bool:
        return True

    def is_err(self) -> bool:
        return False

    def unwrap(self) -> T:
        """Return the success value."""
        return self.value

    def unwrap_err(self) -> NoReturn:
        """Raise `ValueError` — this result is not a failure."""
        msg = f"Called unwrap_err() on Ok({self.value!r})"
        raise ValueError(msg)

    def map[U](self, fn: Callable[[T], U]) -> Ok[U]:
        """Transform the success value."""
        return Ok(fn(self.value))

    def map_err[F](self, fn: Callable[[object], F]) -> Ok[T]:
        """No-op on success; present for symmetric chaining."""
        del fn
        return self

    def and_then[U, E](self, fn: Callable[[T], Result[U, E]]) -> Result[U, E]:
        """Chain another Result-returning operation on success."""
        return fn(self.value)


@dataclass(frozen=True, slots=True)
class Err[E]:
    """Failed result carrying `error`."""

    error: E

    def is_ok(self) -> bool:
        return False

    def is_err(self) -> bool:
        return True

    def unwrap(self) -> NoReturn:
        """Raise `ValueError` — this result is not a success."""
        msg = f"Called unwrap() on Err({self.error!r})"
        raise ValueError(msg)

    def unwrap_err(self) -> E:
        """Return the error payload."""
        return self.error

    def map[U](self, fn: Callable[[object], U]) -> Err[E]:
        """No-op on failure; present for symmetric chaining."""
        del fn
        return self

    def map_err[F](self, fn: Callable[[E], F]) -> Err[F]:
        """Transform the error payload."""
        return Err(fn(self.error))

    def and_then[U, F](self, fn: Callable[[object], Result[U, F]]) -> Err[E]:
        """No-op on failure."""
        del fn
        return self


type Result[T, E] = Ok[T] | Err[E]


def ok[T](value: T) -> Ok[T]:
    """Construct a successful result."""
    return Ok(value)


def err[E](error: E) -> Err[E]:
    """Construct a failed result."""
    return Err(error)
