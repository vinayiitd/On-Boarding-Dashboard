"""
HTTP middleware owned by the bootstrap layer.

Keeps request-correlation logging bound for *every* request without forcing
each endpoint to declare a `RequestContextDep`. Tenant resolution stays in
`api/deps.py` — only tenant-scoped routes pull `TenantContextDep`.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from easyid_api.bootstrap.logging import bind_request_logging, clear_request_logging
from easyid_api.bootstrap.request_context import RequestContext

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"
TENANT_HEADER = "X-Tenant-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Bind request / optional tenant ids into structlog for the request."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        ctx = RequestContext.create(
            request_id=request.headers.get(REQUEST_ID_HEADER),
            correlation_id=request.headers.get(CORRELATION_ID_HEADER),
        )
        raw_tenant = request.headers.get(TENANT_HEADER)
        tenant_id = raw_tenant.strip() if raw_tenant and raw_tenant.strip() else None

        request.state.request_context = ctx
        bind_request_logging(
            request_id=ctx.request_id,
            correlation_id=ctx.correlation_id,
            tenant_id=tenant_id,
        )
        try:
            response = await call_next(request)
        finally:
            clear_request_logging()

        response.headers[REQUEST_ID_HEADER] = ctx.request_id
        response.headers[CORRELATION_ID_HEADER] = ctx.correlation_id
        return response
