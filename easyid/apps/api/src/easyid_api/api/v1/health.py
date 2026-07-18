"""`GET /api/v1/health` — process liveness + version."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from easyid_api.api.deps import SettingsDep

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


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness + version",
    responses={200: {"description": "The API process is reachable."}},
)
async def get_health(settings: SettingsDep) -> HealthResponse:
    """
    Return a shallow health payload for the running process.

    This endpoint confirms the ASGI application is serving traffic. It does
    not probe external dependencies.
    """
    return HealthResponse(status="healthy", version=settings.app_version)
