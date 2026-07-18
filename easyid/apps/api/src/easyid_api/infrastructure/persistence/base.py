"""
Declarative base for persistence mappings.

Concrete ORM table classes live under `mappings/` and subclass `Base`.
Reusable column mixins live in `mixins.py`. Domain entities never import
this module.
"""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase

from easyid_api.infrastructure.persistence.metadata import metadata


class Base(DeclarativeBase):
    """
    Declarative base for all persistence mappings.

    Bound to the shared `metadata` so Alembic sees every mapped table with
    the project naming conventions.
    """

    metadata = metadata
