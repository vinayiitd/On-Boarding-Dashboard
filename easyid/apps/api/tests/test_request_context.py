"""Unit tests for RequestContext and the shared id generator."""

from __future__ import annotations

from easyid_api.bootstrap.ids import new_id
from easyid_api.bootstrap.request_context import RequestContext


def test_new_id_returns_non_empty_string() -> None:
    value = new_id()
    assert isinstance(value, str)
    assert value


def test_request_context_generates_ids() -> None:
    context = RequestContext.create()
    assert context.request_id
    assert context.correlation_id == context.request_id


def test_request_context_respects_supplied_ids() -> None:
    context = RequestContext.create(request_id="req-1", correlation_id="corr-1")
    assert context.request_id == "req-1"
    assert context.correlation_id == "corr-1"


def test_request_context_falls_back_correlation_to_request_id() -> None:
    context = RequestContext.create(request_id="req-1", correlation_id="   ")
    assert context.request_id == "req-1"
    assert context.correlation_id == "req-1"


def test_request_context_is_frozen() -> None:
    context = RequestContext.create(request_id="req-1")
    try:
        context.request_id = "other"  # type: ignore[misc]
    except AttributeError:
        return
    raise AssertionError("RequestContext should be frozen")
