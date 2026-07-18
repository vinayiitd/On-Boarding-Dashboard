"""
Alembic environment.

Wired for async SQLAlchemy — reads `DATABASE_URL` from application settings
and drives migrations through the same engine the app uses.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from easyid_api.config import get_settings
from easyid_api.infrastructure.persistence.base import Base

# ---- ORM model imports ----
# Every model that should participate in autogeneration must be imported
# somewhere before `target_metadata` is read. As new models are added, import
# them here (or in `infrastructure/persistence/models/__init__.py`) so Alembic
# sees them. Deliberately no models yet.
# import easyid_api.infrastructure.persistence.models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Inject the runtime DB URL from application settings so we never store
# secrets in `alembic.ini`.
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — emit SQL without a DB connection."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode against a live async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
