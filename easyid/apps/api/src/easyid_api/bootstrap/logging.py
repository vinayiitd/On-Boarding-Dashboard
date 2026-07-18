"""
Process-wide structured logging.

Configured once at startup from `Settings`. Uses structlog so every log
event is a JSON object in production and a coloured console line in
development. Request / tenant fields are bound via contextvars by the
API dependency layer — see `api/deps.py`.
"""

from __future__ import annotations

import logging
import sys

import structlog

from easyid_api.config import Settings


def configure_logging(settings: Settings) -> None:
    """
    Configure stdlib logging + structlog for the process.

    Safe to call more than once (e.g. in tests) — each call reconfigures.
    """
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.environment == "development":
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Keep noisy third-party loggers quiet unless we are debugging.
    for name in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(name).setLevel(
            logging.DEBUG if settings.log_level == "debug" else logging.WARNING
        )


def bind_request_logging(
    *,
    request_id: str,
    correlation_id: str,
    tenant_id: str | None = None,
) -> None:
    """Bind per-request fields into the structlog contextvars."""
    structlog.contextvars.clear_contextvars()
    payload: dict[str, str] = {
        "request_id": request_id,
        "correlation_id": correlation_id,
    }
    if tenant_id is not None:
        payload["tenant_id"] = tenant_id
    structlog.contextvars.bind_contextvars(**payload)


def clear_request_logging() -> None:
    """Drop per-request fields at the end of a request."""
    structlog.contextvars.clear_contextvars()
