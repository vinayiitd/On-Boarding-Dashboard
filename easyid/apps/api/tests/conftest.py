"""Shared pytest fixtures."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from easyid_api.config import Settings
from easyid_api.main import create_app


@pytest.fixture
def settings() -> Settings:
    """Return deterministic settings for tests."""
    return Settings(
        environment="test",
        app_name="easyID API",
        app_version="0.1.0",
        log_level="warning",
        api_cors_origins="http://test",
    )


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    """Return a fresh FastAPI application instance."""
    return create_app(settings)


@pytest_asyncio.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Return an AsyncClient bound to a fresh app instance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
