"""Shared pytest fixtures."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator, Callable

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from easyid_api.config import Settings
from easyid_api.infrastructure.persistence.engine import build_engine
from easyid_api.infrastructure.persistence.session import build_session_factory
from easyid_api.infrastructure.persistence.unit_of_work import SqlAlchemyUnitOfWork
from easyid_api.main import create_app

DEFAULT_TEST_DATABASE_URL = "postgresql+asyncpg://easyid:easyid@127.0.0.1:5432/easyid"


@pytest.fixture
def database_url() -> str:
    """Return the async database URL used by integration tests."""
    return os.environ.get("DATABASE_URL", DEFAULT_TEST_DATABASE_URL)


@pytest.fixture
def settings(database_url: str) -> Settings:
    """Return deterministic settings for tests."""
    return Settings(
        environment="test",
        app_name="easyID API",
        app_version="0.1.0",
        log_level="warning",
        api_cors_origins="http://test",
        database_url=database_url,
        database_pool_size=2,
        database_max_overflow=0,
    )


@pytest_asyncio.fixture
async def app(settings: Settings) -> AsyncIterator[FastAPI]:
    """Return a fresh FastAPI application and dispose its engine afterward."""
    application = create_app(settings)
    try:
        yield application
    finally:
        await application.state.container.engine.dispose()


@pytest_asyncio.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Return an AsyncClient bound to a fresh app instance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def engine(settings: Settings) -> AsyncIterator[AsyncEngine]:
    """Yield a process engine and dispose it after the test."""
    eng = build_engine(settings)
    try:
        yield eng
    finally:
        await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(
    engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """Return a session factory bound to the test engine."""
    return build_session_factory(engine)


@pytest.fixture
def open_uow(
    session_factory: async_sessionmaker[AsyncSession],
) -> Callable[[], SqlAlchemyUnitOfWork]:
    """Return a factory that opens a new SqlAlchemyUnitOfWork."""

    def _open() -> SqlAlchemyUnitOfWork:
        return SqlAlchemyUnitOfWork(session_factory)

    return _open
