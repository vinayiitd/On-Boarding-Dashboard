"""Smoke tests for the easyid_domain package surface."""

from __future__ import annotations

import easyid_domain
from easyid_domain import (
    AggregateRoot,
    DomainError,
    DomainEvent,
    Entity,
    Identifier,
    Result,
    Specification,
    ValueObject,
    new_id,
    ok,
)


def test_package_exports_kernel_surface() -> None:
    assert "Entity" in easyid_domain.__all__
    assert "AggregateRoot" in easyid_domain.__all__
    assert "ValueObject" in easyid_domain.__all__
    assert "Result" in easyid_domain.__all__


def test_public_symbols_are_importable() -> None:
    assert Entity is not None
    assert AggregateRoot is not None
    assert ValueObject is not None
    assert DomainEvent is not None
    assert DomainError is not None
    assert Specification is not None
    assert Identifier is not None
    assert callable(new_id)
    assert callable(ok)
    assert Result is not None
