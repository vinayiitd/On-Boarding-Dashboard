"""`GET /api/v1/health` — liveness + version."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from easyid_api import __version__

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    """Response shape for the health endpoint. Mirrored in `@easyid/types`."""

    status: Literal["healthy", "degraded", "unhealthy"] = Field(
        ..., examples=["healthy"], description="Overall service health."
    )
    version: str = Field(..., examples=["0.1.0"], description="Semver of the running service.")


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness + version",
    responses={
        200: {"description": "The service is reachable."},
    },
)
async def get_health() -> HealthResponse:
    """
    Return a shallow health payload.

    Deliberately does **not** probe the database — that belongs on a separate
    `/readiness` endpoint so orchestrators can distinguish between the process
    being up and the service being able to serve traffic.
    """
    return HealthResponse(status="healthy", version=__version__)
