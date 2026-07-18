"""
HTTP error contract.

Every non-2xx response emitted by the API returns a JSON body matching
`ApiErrorResponse`. The web app's SDK depends on this shape.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def register_exception_handlers(app: FastAPI) -> None:
    """Attach the standard exception handlers to a FastAPI instance."""

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(
            status=exc.status_code,
            code=f"http_{exc.status_code}",
            message=str(exc.detail) if exc.detail else "Request failed",
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_response(
            status=422,
            code="validation_error",
            message="Request payload failed validation.",
            details={"errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        # Deliberately vague — internal details must not leak to the client.
        return _error_response(
            status=500,
            code="internal_error",
            message="An unexpected error occurred.",
        )


def _error_response(
    *,
    status: int,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"status": status, "code": code, "message": message}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status, content=body)
