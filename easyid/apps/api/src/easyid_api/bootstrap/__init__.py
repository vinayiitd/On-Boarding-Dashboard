"""
Bootstrap layer — composition root for the API process.

Wires the application together without containing business logic.
"""

from easyid_api.bootstrap.container import AppContainer, build_container
from easyid_api.bootstrap.ids import new_id
from easyid_api.bootstrap.lifespan import build_lifespan
from easyid_api.bootstrap.logging import configure_logging
from easyid_api.bootstrap.middleware import RequestContextMiddleware
from easyid_api.bootstrap.request_context import RequestContext

__all__ = [
    "AppContainer",
    "RequestContext",
    "RequestContextMiddleware",
    "build_container",
    "build_lifespan",
    "configure_logging",
    "new_id",
]
