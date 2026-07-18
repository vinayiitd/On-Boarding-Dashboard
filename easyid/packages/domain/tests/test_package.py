"""Smoke tests for the easyid_domain package surface."""

from __future__ import annotations

import easyid_domain


def test_package_imports() -> None:
    """The package is importable and currently exports nothing by design."""
    assert easyid_domain.__all__ == []
