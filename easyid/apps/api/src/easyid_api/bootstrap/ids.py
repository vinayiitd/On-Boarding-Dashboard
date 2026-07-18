"""Shared identifier generation for request / correlation ids."""

from __future__ import annotations

from uuid import uuid4


def new_id() -> str:
    """Return a new opaque identifier."""
    return str(uuid4())
