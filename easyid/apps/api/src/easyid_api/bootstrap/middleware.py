"""
HTTP middleware owned by the bootstrap layer.

Builds a `RequestContext` for every request, binds its ids into the
logging contextvars, and echoes them on the response.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from easyid_api.bootstrap.logging import bind_request_ids, reset_request_ids
from easyid_api.bootstrap.request_context import RequestContext

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Ensure every request carries a stable `RequestContext`."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        context = RequestContext.create(
            request_id=request.headers.get(REQUEST_ID_HEADER),
            correlation_id=request.headers.get(CORRELATION_ID_HEADER),
        )
        request.state.request_context = context

        request_token, correlation_token = bind_request_ids(
            request_id=context.request_id,
            correlation_id=context.correlation_id,
        )
        try:
            response = await call_next(request)
        finally:
            reset_request_ids(request_token, correlation_token)

        response.headers[REQUEST_ID_HEADER] = context.request_id
        response.headers[CORRELATION_ID_HEADER] = context.correlation_id
        return response
