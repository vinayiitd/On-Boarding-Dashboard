"""Aggregate router for API v1."""

from __future__ import annotations

from fastapi import APIRouter

from easyid_api.api.v1 import health

router = APIRouter(prefix="/v1")
router.include_router(health.router)
