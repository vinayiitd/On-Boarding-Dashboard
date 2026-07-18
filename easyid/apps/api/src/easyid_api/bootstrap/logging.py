"""
Process-wide structured logging using the standard library.

JSON lines in non-development environments; human-readable key=value lines
in development. Request / correlation ids are read from contextvars when
present (bound by `RequestContextMiddleware`).
"""

from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar, Token
from datetime import UTC, datetime
from typing import Any

from easyid_api.config import Settings

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)
correlation_id_var: ContextVar[str | None] = ContextVar("correlation_id", default=None)


class StructuredFormatter(logging.Formatter):
    """Render log records as structured JSON or compact key=value text."""

    def __init__(self, *, json_logs: bool) -> None:
        super().__init__()
        self._json_logs = json_logs

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = request_id_var.get()
        correlation_id = correlation_id_var.get()
        if request_id is not None:
            payload["request_id"] = request_id
        if correlation_id is not None:
            payload["correlation_id"] = correlation_id
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        if self._json_logs:
            return json.dumps(payload, default=str)

        parts = [
            payload["timestamp"],
            payload["level"],
            payload["logger"],
            payload["message"],
        ]
        if "request_id" in payload:
            parts.append(f"request_id={payload['request_id']}")
        if "correlation_id" in payload:
            parts.append(f"correlation_id={payload['correlation_id']}")
        line = " | ".join(parts)
        if "exception" in payload:
            return f"{line}\n{payload['exception']}"
        return line


def configure_logging(settings: Settings) -> None:
    """
    Configure root logging for the process.

    Safe to call more than once — each call replaces existing handlers.
    """
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter(json_logs=not settings.is_development))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Keep framework access logs quieter unless we are debugging.
    access_level = logging.DEBUG if settings.log_level == "debug" else logging.WARNING
    logging.getLogger("uvicorn.access").setLevel(access_level)
    logging.getLogger("uvicorn.error").setLevel(level)


def bind_request_ids(
    *,
    request_id: str,
    correlation_id: str,
) -> tuple[Token[str | None], Token[str | None]]:
    """Bind request identifiers into contextvars; return tokens for reset."""
    request_token = request_id_var.set(request_id)
    correlation_token = correlation_id_var.set(correlation_id)
    return request_token, correlation_token


def reset_request_ids(
    request_token: Token[str | None],
    correlation_token: Token[str | None],
) -> None:
    """Clear request identifiers bound for the current context."""
    request_id_var.reset(request_token)
    correlation_id_var.reset(correlation_token)
