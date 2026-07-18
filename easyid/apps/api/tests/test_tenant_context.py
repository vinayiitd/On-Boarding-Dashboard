"""TenantContext + API dependency resolution."""

from __future__ import annotations

import pytest
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient

from easyid_api.api.deps import TenantContextDep
from easyid_api.bootstrap.tenant_context import TenantContext
from easyid_api.main import create_app


def test_tenant_context_rejects_empty_id() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        TenantContext(tenant_id="")
    with pytest.raises(ValueError, match="non-empty"):
        TenantContext(tenant_id="   ")


def test_tenant_context_is_frozen() -> None:
    ctx = TenantContext(tenant_id="tenant_abc")
    with pytest.raises(AttributeError):
        ctx.tenant_id = "other"  # type: ignore[misc]


@pytest.mark.asyncio
async def test_tenant_dep_requires_header() -> None:
    """A route that asks for TenantContextDep must reject missing headers."""
    app = create_app()
    router = APIRouter()

    @router.get("/_test/tenant")
    async def _echo(tenant: TenantContextDep) -> dict[str, str]:
        return {"tenant_id": tenant.tenant_id}

    app.include_router(router)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        missing = await client.get("/_test/tenant")
        assert missing.status_code == 400

        ok = await client.get("/_test/tenant", headers={"X-Tenant-ID": "tenant_abc"})
        assert ok.status_code == 200
        assert ok.json() == {"tenant_id": "tenant_abc"}
