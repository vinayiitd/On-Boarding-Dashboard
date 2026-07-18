"""
Per-request correlation context.

Carries identifiers that travel with a request across logs, traces, and
error responses. Resolved once in `api/deps.py` (or middleware) and
bound into the structlog contextvars so every log line in the request
is tagged automatically.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4


@dataclass(frozen=True, slots=True)
class RequestContext:
    """
    Immutable per-request correlation identifiers.

    Attributes:
        request_id: Unique id for this HTTP request. Generated server-side
            when the client does not supply `X-Request-ID`.
        correlation_id: Optional id that spans multiple services / retries.
            Falls back to `request_id` when the client does not supply
            `X-Correlation-ID`.
    """

    request_id: str
    correlation_id: str

    @classmethod
    def create(
        cls,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> RequestContext:
        """Build a context, generating missing identifiers."""
        rid = (request_id or "").strip() or str(uuid4())
        cid = (correlation_id or "").strip() or rid
        return cls(request_id=rid, correlation_id=cid)
