"""
Per-request correlation context.

Carries identifiers that travel with a request across logs, traces, and
error responses. Built once by `RequestContextMiddleware` and stored on
`request.state.request_context`.
"""

from __future__ import annotations

from dataclasses import dataclass

from easyid_api.bootstrap.ids import new_id


@dataclass(frozen=True, slots=True)
class RequestContext:
    """
    Immutable per-request correlation identifiers.

    Attributes:
        request_id: Unique id for this HTTP request.
        correlation_id: Id that may span multiple services / retries.
            Defaults to `request_id` when the client does not supply one.
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
        """Build a context, generating missing identifiers via `new_id()`."""
        resolved_request_id = _non_empty(request_id) or new_id()
        resolved_correlation_id = _non_empty(correlation_id) or resolved_request_id
        return cls(
            request_id=resolved_request_id,
            correlation_id=resolved_correlation_id,
        )


def _non_empty(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
