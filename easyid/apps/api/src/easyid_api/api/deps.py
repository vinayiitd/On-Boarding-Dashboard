"""
FastAPI dependency-injection callables.

Endpoints declare their needs via `Depends(...)` from this module so nothing
in `application/` has to import FastAPI.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request

from easyid_api.application.ports.health import DatabaseHealth
from easyid_api.application.ports.unit_of_work import UnitOfWork
from easyid_api.bootstrap.container import AppContainer
from easyid_api.bootstrap.request_context import RequestContext
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


def get_database_health(
    container: Annotated[AppContainer, Depends(get_container)],
) -> DatabaseHealth:
    """Return the database health port from the composition root."""
    return container.database_health


def get_request_context(request: Request) -> RequestContext:
    """Return the RequestContext assigned by RequestContextMiddleware."""
    context = getattr(request.state, "request_context", None)
    if not isinstance(context, RequestContext):
        raise RuntimeError("Request context is missing from request state.")
    return context


def get_request_id(
    context: Annotated[RequestContext, Depends(get_request_context)],
) -> str:
    """Return the request id from the current RequestContext."""
    return context.request_id


def get_correlation_id(
    context: Annotated[RequestContext, Depends(get_request_context)],
) -> str:
    """Return the correlation id from the current RequestContext."""
    return context.correlation_id


async def get_unit_of_work(
    container: Annotated[AppContainer, Depends(get_container)],
) -> AsyncIterator[UnitOfWork]:
    """
    Yield a request-scoped Unit of Work.

    The caller (command/query handler) must `commit()` explicitly. Exiting
    without a commit — or with an exception — rolls back.
    """
    async with container.unit_of_work() as uow:
        yield uow


ContainerDep = Annotated[AppContainer, Depends(get_container)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
DatabaseHealthDep = Annotated[DatabaseHealth, Depends(get_database_health)]
RequestContextDep = Annotated[RequestContext, Depends(get_request_context)]
RequestIdDep = Annotated[str, Depends(get_request_id)]
CorrelationIdDep = Annotated[str, Depends(get_correlation_id)]
UnitOfWorkDep = Annotated[UnitOfWork, Depends(get_unit_of_work)]
