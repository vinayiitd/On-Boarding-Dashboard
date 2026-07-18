"""`GET /api/v1/health` — process liveness + database readiness."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from easyid_api.api.deps import DatabaseHealthDep, SettingsDep

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    """Response shape for the health endpoint. Mirrored in `@easyid/types`."""

    status: Literal["healthy", "degraded", "unhealthy"] = Field(
        ...,
        examples=["healthy"],
        description="Overall process health.",
    )
    version: str = Field(
        ...,
        examples=["0.1.0"],
        description="Semver of the running service.",
    )
    database: Literal["up", "down"] = Field(
        ...,
        examples=["up"],
        description="Database connectivity probe result.",
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness + database readiness",
    responses={200: {"description": "The API process is reachable."}},
)
async def get_health(
    settings: SettingsDep,
    database_health: DatabaseHealthDep,
) -> HealthResponse:
    """
    Return process health and a lightweight database probe.

    The endpoint always returns HTTP 200 when the ASGI app is serving; the
    `status` / `database` fields convey dependency readiness for probes.
    """
    db = await database_health.check()
    overall: Literal["healthy", "degraded", "unhealthy"] = (
        "healthy" if db.status == "up" else "degraded"
    )
    return HealthResponse(
        status=overall,
        version=settings.app_version,
        database=db.status,
    )
