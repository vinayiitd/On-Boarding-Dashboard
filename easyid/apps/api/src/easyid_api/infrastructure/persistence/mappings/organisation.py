"""SQLAlchemy mapping for the Organisation aggregate."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from easyid_api.infrastructure.persistence.base import Base
from easyid_api.infrastructure.persistence.ids import to_domain_id, to_uuid
from easyid_domain.organisation import (
    Organisation,
    OrganisationId,
    OrganisationName,
    OrganisationStatus,
)


class OrganisationModel(Base):
    """ORM row for the `organisations` table."""

    __tablename__ = "organisations"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


def to_domain(model: OrganisationModel) -> Organisation:
    """Map an ORM row to the Organisation aggregate via `Organisation.rehydrate`."""
    return Organisation.rehydrate(
        organisation_id=to_domain_id(OrganisationId, model.id),
        name=OrganisationName(model.name),
        status=OrganisationStatus(model.status),
        created_at=model.created_at,
        updated_at=model.updated_at,
        version=model.version,
    )


def from_domain(aggregate: Organisation) -> OrganisationModel:
    """Map an Organisation aggregate to a new ORM row."""
    return OrganisationModel(
        id=to_uuid(aggregate.id),
        name=aggregate.name.value,
        status=aggregate.status.value,
        version=aggregate.version,
        created_at=aggregate.created_at,
        updated_at=aggregate.updated_at,
    )
