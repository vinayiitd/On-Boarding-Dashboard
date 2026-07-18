"""
HTTP middleware owned by the bootstrap layer.

Assigns a request id and correlation id to every request, binds them into
the logging contextvars, and echoes them on the response.
"""

from __future__ import annotations

from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from easyid_api.bootstrap.logging import bind_request_ids, reset_request_ids

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Ensure every request carries stable request and correlation ids."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = _header_or_new(request, REQUEST_ID_HEADER)
        correlation_id = _header_or_new(request, CORRELATION_ID_HEADER, fallback=request_id)

        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        request_token, correlation_token = bind_request_ids(
            request_id=request_id,
            correlation_id=correlation_id,
        )
        try:
            response = await call_next(request)
        finally:
            reset_request_ids(request_token, correlation_token)

        response.headers[REQUEST_ID_HEADER] = request_id
        response.headers[CORRELATION_ID_HEADER] = correlation_id
        return response


def _header_or_new(
    request: Request,
    header_name: str,
    *,
    fallback: str | None = None,
) -> str:
    raw = request.headers.get(header_name)
    if raw is not None and raw.strip():
        return raw.strip()
    if fallback is not None:
        return fallback
    return str(uuid4())
