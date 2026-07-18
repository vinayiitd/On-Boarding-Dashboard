"""
Entity primary-key generation.

Prepared for UUIDv7: the public seam is `generate_entity_id()`. Today it
returns UUID4 because Python 3.13's stdlib has no `uuid.uuid7` (added in
3.14). Swap the body of `generate_entity_id` — and only that body — when
adopting UUIDv7. Callers and column defaults must not call `uuid4()`
directly.
"""

from __future__ import annotations

from uuid import UUID, uuid4

# Bump this when the generator switches (useful for ops / debugging).
ENTITY_ID_STRATEGY: str = "uuid4"


def generate_entity_id() -> UUID:
    """
    Return a new entity primary key.

    Strategy: UUID4 (see `ENTITY_ID_STRATEGY`). Replace with UUIDv7 when the
    runtime supports it (Python 3.14+ `uuid.uuid7` or an approved library).
    """
    return uuid4()
