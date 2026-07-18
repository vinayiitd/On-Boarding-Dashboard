"""Specification pattern — composable business predicates."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import override


class Specification[T](ABC):
    """
    Boolean predicate over a candidate of type `T`.

    Compose with `&`, `|`, and `~` (or `and_`, `or_`, `not_`) to build
    richer rules without embedding them in entity methods.
    """

    @abstractmethod
    def is_satisfied_by(self, candidate: T) -> bool:
        """Return True when `candidate` meets this specification."""

    def and_(self, other: Specification[T]) -> Specification[T]:
        return _And(self, other)

    def or_(self, other: Specification[T]) -> Specification[T]:
        return _Or(self, other)

    def not_(self) -> Specification[T]:
        return _Not(self)

    def __and__(self, other: Specification[T]) -> Specification[T]:
        return self.and_(other)

    def __or__(self, other: Specification[T]) -> Specification[T]:
        return self.or_(other)

    def __invert__(self) -> Specification[T]:
        return self.not_()


class _And[T](Specification[T]):
    def __init__(self, left: Specification[T], right: Specification[T]) -> None:
        self._left = left
        self._right = right

    @override
    def is_satisfied_by(self, candidate: T) -> bool:
        return self._left.is_satisfied_by(candidate) and self._right.is_satisfied_by(candidate)


class _Or[T](Specification[T]):
    def __init__(self, left: Specification[T], right: Specification[T]) -> None:
        self._left = left
        self._right = right

    @override
    def is_satisfied_by(self, candidate: T) -> bool:
        return self._left.is_satisfied_by(candidate) or self._right.is_satisfied_by(candidate)


class _Not[T](Specification[T]):
    def __init__(self, inner: Specification[T]) -> None:
        self._inner = inner

    @override
    def is_satisfied_by(self, candidate: T) -> bool:
        return not self._inner.is_satisfied_by(candidate)
