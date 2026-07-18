"""
Bootstrap layer — composition root for the API process.

Wires the application together without containing business logic.
"""

from easyid_api.bootstrap.container import AppContainer, build_container
from easyid_api.bootstrap.lifespan import build_lifespan
from easyid_api.bootstrap.logging import configure_logging
from easyid_api.bootstrap.middleware import RequestContextMiddleware

__all__ = [
    "AppContainer",
    "RequestContextMiddleware",
    "build_container",
    "build_lifespan",
    "configure_logging",
]
