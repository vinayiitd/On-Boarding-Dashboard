"""Smoke tests for `GET /api/v1/health`."""

from __future__ import annotations

from httpx import AsyncClient

from easyid_api import __version__


async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


async def test_health_returns_expected_contract(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    payload = response.json()
    assert payload == {"status": "healthy", "version": __version__}


async def test_openapi_document_is_served(client: AsyncClient) -> None:
    """
    Guardrail — Swagger/OpenAPI must be reachable so downstream tooling
    (SDK codegen, Postman imports, docs sites) can rely on it.
    """
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    doc = response.json()
    assert doc["info"]["title"] == "easyID API"
    assert "/api/v1/health" in doc["paths"]
