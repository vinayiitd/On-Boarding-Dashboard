"""Application factory / startup smoke tests."""

from __future__ import annotations

from fastapi import FastAPI
from httpx import AsyncClient

from easyid_api.bootstrap.container import AppContainer
from easyid_api.config import Settings
from easyid_api.main import create_app


def test_create_app_returns_fastapi_instance(settings: Settings) -> None:
    app = create_app(settings)
    assert isinstance(app, FastAPI)
    assert app.title == settings.app_name
    assert app.version == settings.app_version


def test_create_app_attaches_composition_root(settings: Settings) -> None:
    app = create_app(settings)
    container = app.state.container
    assert isinstance(container, AppContainer)
    assert container.settings is settings


async def test_openapi_document_contains_metadata(client: AsyncClient) -> None:
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "easyID API"
    assert document["info"]["version"] == "0.1.0"
    assert "contact" in document["info"]
    assert "/api/v1/health" in document["paths"]
