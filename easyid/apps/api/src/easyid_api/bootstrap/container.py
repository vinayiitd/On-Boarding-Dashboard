"""
Composition root.

Builds the process-scoped object graph. Kept deliberately thin — no
business logic, no FastAPI types, no I/O. Request-scoped resources are
resolved in `api/deps.py`.
"""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.config import Settings


@dataclass(frozen=True, slots=True)
class AppContainer:
    """
    Immutable process-scoped dependencies.

    Add ports → adapter bindings here as later foundations introduce them.
    """

    settings: Settings


def build_container(settings: Settings) -> AppContainer:
    """Wire process-scoped collaborators and return the composed container."""
    return AppContainer(settings=settings)
