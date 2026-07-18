"""Tests for `GET /api/v1/health`."""

from __future__ import annotations

from httpx import AsyncClient


async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


async def test_health_returns_expected_contract(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.json() == {
        "status": "healthy",
        "version": "0.1.0",
        "database": "up",
    }


async def test_health_echoes_request_and_correlation_ids(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/health",
        headers={
            "X-Request-ID": "req-fixed",
            "X-Correlation-ID": "corr-fixed",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == "req-fixed"
    assert response.headers.get("X-Correlation-ID") == "corr-fixed"


async def test_health_generates_request_id_when_absent(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    request_id = response.headers.get("X-Request-ID")
    correlation_id = response.headers.get("X-Correlation-ID")
    assert request_id
    assert correlation_id == request_id
