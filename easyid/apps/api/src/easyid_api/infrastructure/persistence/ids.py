"""
Entity primary-key generation and domain identifier conversion.

Prepared for UUIDv7: the public seam is `generate_entity_id()`. Today it
returns UUID4 because Python 3.13's stdlib has no `uuid.uuid7` (added in
3.14). Swap the body of `generate_entity_id` — and only that body — when
adopting UUIDv7. Callers and column defaults must not call `uuid4()`
directly.

Conversion helpers isolate UUID ↔ domain `Identifier` mapping so concrete
repositories stay free of ad-hoc wrapping.
"""

from __future__ import annotations

from uuid import UUID, uuid4

from easyid_domain.kernel.identity import Identifier

# Bump this when the generator switches (useful for ops / debugging).
ENTITY_ID_STRATEGY: str = "uuid4"


def generate_entity_id() -> UUID:
    """
    Return a new entity primary key.

    Strategy: UUID4 (see `ENTITY_ID_STRATEGY`). Replace with UUIDv7 when the
    runtime supports it (Python 3.14+ `uuid.uuid7` or an approved library).
    """
    return uuid4()


def to_uuid(identifier: Identifier) -> UUID:
    """Extract the raw UUID stored by a domain identifier."""
    return identifier.value


def to_domain_id[TId: Identifier](id_type: type[TId], value: UUID) -> TId:
    """Wrap a raw UUID in the given domain identifier type."""
    return id_type(value)
