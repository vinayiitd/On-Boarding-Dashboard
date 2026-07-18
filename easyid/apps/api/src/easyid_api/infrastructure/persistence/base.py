"""
Declarative base and reusable mapping mixins.

Persistence mappings (ORM table classes) live under `mappings/` and subclass
`Base`. Domain entities never import this module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, Integer, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column
from sqlalchemy.types import Uuid

from easyid_api.infrastructure.persistence.ids import generate_entity_id
from easyid_api.infrastructure.persistence.metadata import metadata


class Base(DeclarativeBase):
    """
    Declarative base for all persistence mappings.

    Bound to the shared `metadata` so Alembic sees every mapped table with
    the project naming conventions.
    """

    metadata = metadata


class UuidPrimaryKeyMixin:
    """
    UUID primary key prepared for UUIDv7.

    Uses `generate_entity_id()` as the Python-side default so the generator
    strategy can change in one place.
    """

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=generate_entity_id,
    )


class TimestampMixin:
    """Created / updated audit columns (UTC, server-side defaults)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class VersionedMixin:
    """
    Optimistic locking support via SQLAlchemy `version_id_col`.

    Include this mixin on a concrete mapping to participate in optimistic
    concurrency. Concurrent updates that do not refresh `version` raise
    `sqlalchemy.orm.exc.StaleDataError`.
    """

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    @declared_attr.directive
    def __mapper_args__(self) -> dict[str, Any]:
        # `self` is the concrete mapped class when SQLAlchemy evaluates this.
        table = getattr(self, "__table__", None)
        if table is None:
            return {}
        return {"version_id_col": table.c.version}
