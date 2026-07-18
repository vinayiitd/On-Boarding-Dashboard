"""
Global exception handling using RFC 7807 Problem Details.

Every non-2xx response emitted by the API returns
`Content-Type: application/problem+json` with a body matching the Problem
Details schema. Internal exception details never leak to clients.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

PROBLEM_JSON = "application/problem+json"
PROBLEM_TYPE_BASE = "https://easyid.app/problems"


def register_exception_handlers(app: FastAPI) -> None:
    """Attach RFC 7807 exception handlers to a FastAPI instance."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        title = _http_title(exc.status_code)
        detail = _http_detail(exc)
        return problem_response(
            request=request,
            status_code=exc.status_code,
            title=title,
            detail=detail,
            problem_type=f"{PROBLEM_TYPE_BASE}/http-{exc.status_code}",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return problem_response(
            request=request,
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            title="Validation Error",
            detail="Request payload failed validation.",
            problem_type=f"{PROBLEM_TYPE_BASE}/validation-error",
            extensions={"errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception", exc_info=exc)
        return problem_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Internal Server Error",
            detail="An unexpected error occurred.",
            problem_type=f"{PROBLEM_TYPE_BASE}/internal-error",
        )


def problem_response(
    *,
    request: Request,
    status_code: int,
    title: str,
    detail: str,
    problem_type: str,
    extensions: dict[str, Any] | None = None,
) -> JSONResponse:
    """Build an RFC 7807 Problem Details response."""
    body: dict[str, Any] = {
        "type": problem_type,
        "title": title,
        "status": status_code,
        "detail": detail,
        "instance": request.url.path,
    }
    context = getattr(request.state, "request_context", None)
    if context is not None:
        body["request_id"] = context.request_id
        body["correlation_id"] = context.correlation_id
    if extensions:
        body.update(extensions)

    return JSONResponse(
        status_code=status_code,
        content=body,
        media_type=PROBLEM_JSON,
    )


def _http_title(status_code: int) -> str:
    return {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        409: "Conflict",
        422: "Validation Error",
        429: "Too Many Requests",
        500: "Internal Server Error",
        503: "Service Unavailable",
    }.get(status_code, "HTTP Error")


def _http_detail(exc: StarletteHTTPException) -> str:
    if isinstance(exc.detail, str) and exc.detail.strip():
        return exc.detail
    return _http_title(exc.status_code)
