"""
Application settings.

All runtime configuration is sourced from environment variables via
Pydantic Settings v2. Constructed once per application instance and held
on the composition root — never cached in a process-global singleton.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed runtime configuration for the API process."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "easyID API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: Literal["debug", "info", "warning", "error", "critical"] = Field(
        default="info",
        alias="API_LOG_LEVEL",
    )

    api_host: str = Field(default="0.0.0.0", alias="API_HOST")  # noqa: S104 — bind-all is intentional
    api_port: int = Field(default=8000, alias="API_PORT")
    api_cors_origins: str = Field(default="http://localhost:3000", alias="API_CORS_ORIGINS")
    """Comma-separated list of allowed CORS origins."""

    api_root_path: str = Field(default="", alias="API_ROOT_PATH")
    """Optional path prefix when mounted behind a reverse proxy."""

    openapi_contact_name: str = Field(
        default="easyID Engineering",
        alias="OPENAPI_CONTACT_NAME",
    )
    openapi_contact_email: str = Field(
        default="engineering@easyid.app",
        alias="OPENAPI_CONTACT_EMAIL",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origin list."""
        raw = self.api_cors_origins.strip()
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        """True when running in the local development environment."""
        return self.environment == "development"
