"""
FastAPI dependency-injection callables.

Endpoints declare their needs via `Depends(...)` from this module so nothing
in `application/` has to import FastAPI.

Tenant isolation rule
---------------------
The API resolves the tenant **once** per request here and exposes it as
`TenantContextDep`. Every tenant-scoped command / query handler must take
a `TenantContext` argument — never a raw tenant id string from the client.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.bootstrap.container import AppContainer
from easyid_api.bootstrap.request_context import RequestContext
from easyid_api.bootstrap.tenant_context import TenantContext
from easyid_api.config import Settings, get_settings
from easyid_api.infrastructure.persistence.session import get_session

# Header names — keep stable; the web SDK and any gateway must agree.
TENANT_HEADER = "X-Tenant-ID"
REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


def get_container(request: Request) -> AppContainer:
    """Return the process-scoped DI container built during lifespan startup."""
    container = getattr(request.app.state, "container", None)
    if container is None:
        # Lifespan has not run (e.g. a misconfigured test). Fall back so
        # unit tests that only need settings still work.
        return AppContainer(settings=get_settings())
    return container  # type: ignore[no-any-return]


def get_request_context(request: Request) -> RequestContext:
    """
    Return the RequestContext bound by `RequestContextMiddleware`.

    Falls back to constructing one from headers if the middleware has not
    run (e.g. in a narrowly scoped unit test).
    """
    ctx = getattr(request.state, "request_context", None)
    if isinstance(ctx, RequestContext):
        return ctx
    return RequestContext.create(
        request_id=request.headers.get(REQUEST_ID_HEADER),
        correlation_id=request.headers.get(CORRELATION_ID_HEADER),
    )


def get_tenant_context(
    x_tenant_id: Annotated[str | None, Header(alias=TENANT_HEADER)] = None,
) -> TenantContext:
    """
    Resolve the tenant for this request.

    Today the tenant is read from the `X-Tenant-ID` header — a deliberate
    scaffold so the isolation path is in place before authentication lands.
    When identity adapters arrive (`infrastructure/identity/`), this
    dependency will derive the tenant from the authenticated principal
    instead of trusting a raw header.
    """
    if x_tenant_id is None or not x_tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required header: {TENANT_HEADER}",
        )
    try:
        return TenantContext(tenant_id=x_tenant_id.strip())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


async def db_session() -> AsyncIterator[AsyncSession]:
    """Yield a per-request async SQLAlchemy session."""
    async with get_session() as session:
        yield session


SettingsDep = Annotated[Settings, Depends(get_settings)]
ContainerDep = Annotated[AppContainer, Depends(get_container)]
RequestContextDep = Annotated[RequestContext, Depends(get_request_context)]
TenantContextDep = Annotated[TenantContext, Depends(get_tenant_context)]
DbSessionDep = Annotated[AsyncSession, Depends(db_session)]
