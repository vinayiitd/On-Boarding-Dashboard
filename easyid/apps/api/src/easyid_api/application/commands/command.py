"""Command marker — write intent in the application layer."""

from __future__ import annotations

from typing import Protocol


class Command(Protocol):
    """
    Marker protocol for a write intent.

    Concrete commands are typically frozen dataclasses carrying the inputs
    a handler needs. No members are required — the Protocol exists so
    `CommandHandler` TypeVars can be bound to write intents rather than
    arbitrary objects.
    """
