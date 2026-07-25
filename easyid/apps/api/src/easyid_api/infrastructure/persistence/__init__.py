"""
Persistence adapters — SQLAlchemy 2.x async + PostgreSQL (asyncpg).

This package is the only place in the API that may import SQLAlchemy.
Alembic migrations target `metadata` from `metadata.py` and discover
mappings under `mappings/`.
"""

from easyid_api.infrastructure.persistence.base import Base
from easyid_api.infrastructure.persistence.engine import build_engine
from easyid_api.infrastructure.persistence.health import SqlAlchemyDatabaseHealth
from easyid_api.infrastructure.persistence.ids import (
    generate_entity_id,
    to_domain_id,
    to_uuid,
)
from easyid_api.infrastructure.persistence.metadata import metadata
from easyid_api.infrastructure.persistence.repository import SessionRepository
from easyid_api.infrastructure.persistence.session import (
    build_session_factory,
    create_session,
)
from easyid_api.infrastructure.persistence.unit_of_work import SqlAlchemyUnitOfWork

__all__ = [
    "Base",
    "SessionRepository",
    "SqlAlchemyDatabaseHealth",
    "SqlAlchemyUnitOfWork",
    "build_engine",
    "build_session_factory",
    "create_session",
    "generate_entity_id",
    "metadata",
    "to_domain_id",
    "to_uuid",
]
