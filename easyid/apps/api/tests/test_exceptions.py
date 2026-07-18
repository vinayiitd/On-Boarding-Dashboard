"""RFC 7807 Problem Details exception handling."""

from __future__ import annotations

from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient

from easyid_api.config import Settings
from easyid_api.main import create_app


async def test_not_found_returns_problem_details(client: AsyncClient) -> None:
    response = await client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["type"] == "https://easyid.app/problems/http-404"
    assert body["title"] == "Not Found"
    assert body["status"] == 404
    assert body["instance"] == "/api/v1/does-not-exist"
    assert "request_id" in body
    assert "correlation_id" in body


async def test_validation_error_returns_problem_details(settings: Settings) -> None:
    app = create_app(settings)
    router = APIRouter()

    @router.post("/_test/echo")
    async def echo(payload: dict[str, str]) -> dict[str, str]:
        return payload

    app.include_router(router)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        response = await http_client.post("/_test/echo", json=["not", "an", "object"])

    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["type"] == "https://easyid.app/problems/validation-error"
    assert body["title"] == "Validation Error"
    assert body["status"] == 422
    assert "errors" in body


async def test_unhandled_exception_returns_problem_details(settings: Settings) -> None:
    app = create_app(settings)
    router = APIRouter()

    @router.get("/_test/boom")
    async def boom() -> None:
        raise RuntimeError("boom")

    app.include_router(router)

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        response = await http_client.get("/_test/boom")

    assert response.status_code == 500
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["type"] == "https://easyid.app/problems/internal-error"
    assert body["title"] == "Internal Server Error"
    assert body["detail"] == "An unexpected error occurred."
    assert "boom" not in body["detail"]
