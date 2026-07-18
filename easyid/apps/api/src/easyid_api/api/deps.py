"""
FastAPI dependency-injection callables.

Endpoints declare their needs via `Depends(...)` from this module so nothing
in `application/` has to import FastAPI.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from easyid_api.bootstrap.container import AppContainer
from easyid_api.config import Settings


def get_container(request: Request) -> AppContainer:
    """Return the process-scoped composition root attached during lifespan."""
    container = getattr(request.app.state, "container", None)
    if not isinstance(container, AppContainer):
        raise RuntimeError(
            "Application container is not available. "
            "Ensure the app was created via create_app() and lifespan has started."
        )
    return container


def get_settings(container: Annotated[AppContainer, Depends(get_container)]) -> Settings:
    """Return the Settings instance owned by the composition root."""
    return container.settings


def get_request_id(request: Request) -> str:
    """Return the request id assigned by RequestContextMiddleware."""
    request_id = getattr(request.state, "request_id", None)
    if not isinstance(request_id, str) or not request_id:
        raise RuntimeError("Request id is missing from request state.")
    return request_id


def get_correlation_id(request: Request) -> str:
    """Return the correlation id assigned by RequestContextMiddleware."""
    correlation_id = getattr(request.state, "correlation_id", None)
    if not isinstance(correlation_id, str) or not correlation_id:
        raise RuntimeError("Correlation id is missing from request state.")
    return correlation_id


ContainerDep = Annotated[AppContainer, Depends(get_container)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
RequestIdDep = Annotated[str, Depends(get_request_id)]
CorrelationIdDep = Annotated[str, Depends(get_correlation_id)]
