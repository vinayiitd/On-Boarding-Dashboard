"""
Application settings.

All runtime configuration is sourced from environment variables via
`pydantic-settings`, so the process can be moved between local, CI, and prod
without code changes.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed runtime configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- Meta ---------------------------------------------------------------
    app_name: str = "easyID API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: Literal["debug", "info", "warning", "error", "critical"] = Field(
        default="info", alias="API_LOG_LEVEL"
    )

    # ---- HTTP ---------------------------------------------------------------
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")  # noqa: S104 — dev default
    api_port: int = Field(default=8000, alias="API_PORT")

    api_cors_origins: str = Field(default="*", alias="API_CORS_ORIGINS")
    """Comma-separated list of allowed CORS origins. Use `*` for dev only."""

    # ---- Database -----------------------------------------------------------
    database_url: str = Field(
        default="postgresql+asyncpg://easyid:easyid@localhost:5432/easyid",
        alias="DATABASE_URL",
    )
    db_pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")
    db_pool_timeout: int = Field(default=30, alias="DB_POOL_TIMEOUT")
    db_pool_recycle: int = Field(default=1800, alias="DB_POOL_RECYCLE")
    db_echo: bool = Field(default=False, alias="DB_ECHO")

    # ---- Derived ------------------------------------------------------------
    @field_validator("database_url")
    @classmethod
    def _validate_async_scheme(cls, v: str) -> str:
        """Guard against forgetting the `+asyncpg` driver suffix."""
        if v.startswith("postgresql://"):
            raise ValueError(
                "DATABASE_URL uses the sync scheme `postgresql://`. "
                "This application uses async SQLAlchemy — use "
                "`postgresql+asyncpg://` instead."
            )
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origin list."""
        raw = self.api_cors_origins.strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return the cached application settings.

    Cached because `Settings()` reads `.env` from disk; there is no reason to
    re-parse it per request.
    """
    return Settings()
