"""SQLAlchemy declarative base."""

from __future__ import annotations

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Consistent naming convention → Alembic autogenerates stable index / FK / PK
# names that don't churn between generations.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base for every ORM model. Models live in `infrastructure/db/models/`."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
