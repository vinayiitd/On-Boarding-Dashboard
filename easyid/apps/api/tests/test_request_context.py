"""RequestContext middleware smoke tests."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from easyid_api.bootstrap.request_context import RequestContext
from easyid_api.main import create_app


def test_request_context_generates_ids() -> None:
    ctx = RequestContext.create()
    assert ctx.request_id
    assert ctx.correlation_id == ctx.request_id


def test_request_context_respects_supplied_ids() -> None:
    ctx = RequestContext.create(request_id="req-1", correlation_id="corr-1")
    assert ctx.request_id == "req-1"
    assert ctx.correlation_id == "corr-1"


@pytest.mark.asyncio
async def test_health_echoes_request_id_header() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"X-Request-ID": "req-fixed"},
        )
        assert response.status_code == 200
        assert response.headers.get("X-Request-ID") == "req-fixed"
        assert response.headers.get("X-Correlation-ID") == "req-fixed"
