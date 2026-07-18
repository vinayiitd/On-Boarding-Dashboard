"""Application factory / startup smoke tests."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from easyid_api.bootstrap.container import AppContainer
from easyid_api.config import Settings
from easyid_api.main import create_app


@pytest_asyncio.fixture
async def built_app(settings: Settings) -> AsyncIterator[FastAPI]:
    """Build an app for sync-style assertions and dispose its engine."""
    application = create_app(settings)
    try:
        yield application
    finally:
        await application.state.container.engine.dispose()


@pytest.mark.asyncio
async def test_create_app_returns_fastapi_instance(built_app: FastAPI, settings: Settings) -> None:
    assert isinstance(built_app, FastAPI)
    assert built_app.title == settings.app_name
    assert built_app.version == settings.app_version


@pytest.mark.asyncio
async def test_create_app_attaches_composition_root(
    built_app: FastAPI,
    settings: Settings,
) -> None:
    container = built_app.state.container
    assert isinstance(container, AppContainer)
    assert container.settings is settings
    assert container.engine is not None
    assert container.session_factory is not None
    assert container.database_health is not None


async def test_openapi_document_contains_metadata(client: AsyncClient) -> None:
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "easyID API"
    assert document["info"]["version"] == "0.1.0"
    assert "contact" in document["info"]
    assert "/api/v1/health" in document["paths"]
