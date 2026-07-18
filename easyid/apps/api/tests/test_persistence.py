"""Integration tests for connection, session lifecycle, and Unit of Work."""

from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

import pytest
from sqlalchemy import Column, MetaData, String, Table, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from easyid_api.infrastructure.persistence.health import SqlAlchemyDatabaseHealth
from easyid_api.infrastructure.persistence.ids import (
    ENTITY_ID_STRATEGY,
    generate_entity_id,
)
from easyid_api.infrastructure.persistence.metadata import NAMING_CONVENTION
from easyid_api.infrastructure.persistence.repositories import SqlAlchemyRepository
from easyid_api.infrastructure.persistence.unit_of_work import SqlAlchemyUnitOfWork

pytestmark = pytest.mark.integration

PROBE_TABLE = "_fnd003_uow_probe"


async def _ensure_probe_table(engine: AsyncEngine) -> None:
    """Create a disposable probe table used only by these tests."""
    async with engine.begin() as conn:
        await conn.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS {PROBE_TABLE} (
                    id UUID PRIMARY KEY,
                    label TEXT NOT NULL
                )
                """
            )
        )
        await conn.execute(text(f"TRUNCATE {PROBE_TABLE}"))


@pytest.mark.asyncio
async def test_database_connection(engine: AsyncEngine) -> None:
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        assert result.scalar_one() == 1


@pytest.mark.asyncio
async def test_database_health_service_up(engine: AsyncEngine) -> None:
    health = SqlAlchemyDatabaseHealth(engine)
    status = await health.check()
    assert status.status == "up"
    assert status.detail is None


@pytest.mark.asyncio
async def test_session_lifecycle(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    session = session_factory()
    try:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar_one() == 1
        assert session.is_active
    finally:
        await session.close()
    # After close the session is no longer in a transaction.
    assert session.get_transaction() is None


@pytest.mark.asyncio
async def test_unit_of_work_commit(
    engine: AsyncEngine,
    open_uow: Callable[[], SqlAlchemyUnitOfWork],
) -> None:
    await _ensure_probe_table(engine)
    entity_id = generate_entity_id()

    async with open_uow() as uow:
        await uow.session.execute(
            text(f"INSERT INTO {PROBE_TABLE} (id, label) VALUES (:id, :label)"),
            {"id": entity_id, "label": "committed"},
        )
        await uow.commit()

    async with open_uow() as uow:
        result = await uow.session.execute(
            text(f"SELECT label FROM {PROBE_TABLE} WHERE id = :id"),
            {"id": entity_id},
        )
        assert result.scalar_one() == "committed"


@pytest.mark.asyncio
async def test_unit_of_work_rollback_on_exit_without_commit(
    engine: AsyncEngine,
    open_uow: Callable[[], SqlAlchemyUnitOfWork],
) -> None:
    await _ensure_probe_table(engine)
    entity_id = generate_entity_id()

    async with open_uow() as uow:
        await uow.session.execute(
            text(f"INSERT INTO {PROBE_TABLE} (id, label) VALUES (:id, :label)"),
            {"id": entity_id, "label": "rolled-back"},
        )
        # No commit — __aexit__ must roll back.

    async with open_uow() as uow:
        result = await uow.session.execute(
            text(f"SELECT label FROM {PROBE_TABLE} WHERE id = :id"),
            {"id": entity_id},
        )
        assert result.first() is None


@pytest.mark.asyncio
async def test_unit_of_work_rollback_on_exception(
    engine: AsyncEngine,
    open_uow: Callable[[], SqlAlchemyUnitOfWork],
) -> None:
    await _ensure_probe_table(engine)
    entity_id = generate_entity_id()

    with pytest.raises(RuntimeError, match="boom"):
        async with open_uow() as uow:
            await uow.session.execute(
                text(f"INSERT INTO {PROBE_TABLE} (id, label) VALUES (:id, :label)"),
                {"id": entity_id, "label": "exploded"},
            )
            raise RuntimeError("boom")

    async with open_uow() as uow:
        result = await uow.session.execute(
            text(f"SELECT label FROM {PROBE_TABLE} WHERE id = :id"),
            {"id": entity_id},
        )
        assert result.first() is None


@pytest.mark.asyncio
async def test_unit_of_work_session_unavailable_before_enter(
    open_uow: Callable[[], SqlAlchemyUnitOfWork],
) -> None:
    uow = open_uow()
    with pytest.raises(RuntimeError, match="has not been entered"):
        _ = uow.session


def test_generate_entity_id_returns_uuid() -> None:
    value = generate_entity_id()
    assert isinstance(value, UUID)
    assert ENTITY_ID_STRATEGY == "uuid4"


def test_naming_convention_keys_are_complete() -> None:
    assert set(NAMING_CONVENTION) >= {"ix", "uq", "ck", "fk", "pk"}
    md = MetaData(naming_convention=NAMING_CONVENTION)
    table = Table(
        "_naming_probe",
        md,
        Column("id", String, primary_key=True),
        Column("code", String, unique=True),
    )
    assert table.primary_key.name == "pk__naming_probe"
    assert any(c.name == "uq__naming_probe_code" for c in table.constraints)


@pytest.mark.asyncio
async def test_repository_base_roundtrip(
    engine: AsyncEngine,
    open_uow: Callable[[], SqlAlchemyUnitOfWork],
) -> None:
    """Exercise SqlAlchemyRepository against a throwaway mapping (not a business entity)."""

    class ProbeBase(DeclarativeBase):
        metadata = MetaData(naming_convention=NAMING_CONVENTION)

    class ProbeMapping(ProbeBase):
        __tablename__ = "_fnd003_repo_probe"

        id: Mapped[UUID] = mapped_column(primary_key=True)
        label: Mapped[str] = mapped_column(String(64), nullable=False)

    class ProbeRepository(SqlAlchemyRepository[ProbeMapping]):
        mapping_cls = ProbeMapping

    async with engine.begin() as conn:
        await conn.run_sync(ProbeBase.metadata.create_all)
        await conn.execute(text("TRUNCATE _fnd003_repo_probe"))

    entity_id = generate_entity_id()
    async with open_uow() as uow:
        repo = ProbeRepository(uow.session)
        await repo.add(ProbeMapping(id=entity_id, label="hello"))
        await uow.commit()

    async with open_uow() as uow:
        repo = ProbeRepository(uow.session)
        loaded = await repo.get_by_id(entity_id)
        assert loaded is not None
        assert loaded.label == "hello"
        await repo.remove(loaded)
        await uow.commit()

    async with open_uow() as uow:
        repo = ProbeRepository(uow.session)
        assert await repo.get_by_id(entity_id) is None
