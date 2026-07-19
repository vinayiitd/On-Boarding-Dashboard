"""Query marker — read intent in the application layer."""

from __future__ import annotations

from typing import Protocol


class Query(Protocol):
    """
    Marker protocol for a read intent.

    Concrete queries are typically frozen dataclasses carrying filter /
    lookup inputs. No members are required — the Protocol exists so
    `QueryHandler` TypeVars can be bound to read intents rather than
    arbitrary objects.
    """
