"""
Composition root.

Builds the object graph that connects application ports to infrastructure
adapters. Kept deliberately thin — no business logic, no FastAPI types.

The container is constructed once at process startup (see `lifespan.py`)
and stashed on `app.state.container` so request-scoped dependencies can
pull from it without reaching into module-level globals.
"""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.config import Settings


@dataclass(slots=True)
class AppContainer:
    """
    Process-scoped dependencies.

    Add repositories / clients here as ports gain concrete adapters.
    Request-scoped resources (DB sessions, TenantContext) are *not*
    stored here — they are resolved per request in `api/deps.py`.
    """

    settings: Settings


def build_container(settings: Settings) -> AppContainer:
    """Wire ports to adapters and return the composed container."""
    return AppContainer(settings=settings)
