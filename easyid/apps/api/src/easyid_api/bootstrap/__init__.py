"""
Bootstrap layer — composition root for the API process.

Wires the application together without containing business logic:

- `logging.py`         — process-wide structured logging setup
- `lifespan.py`        — FastAPI startup / shutdown
- `container.py`       — DI composition root (ports → adapters)
- `middleware.py`      — request-correlation logging middleware
- `request_context.py` — per-request correlation identifiers
- `tenant_context.py`  — per-request tenant isolation context

Nothing in this package may import domain business rules or implement a
use case. It only configures and connects.
"""

from easyid_api.bootstrap.container import AppContainer, build_container
from easyid_api.bootstrap.lifespan import build_lifespan
from easyid_api.bootstrap.logging import configure_logging
from easyid_api.bootstrap.request_context import RequestContext
from easyid_api.bootstrap.tenant_context import TenantContext

__all__ = [
    "AppContainer",
    "RequestContext",
    "TenantContext",
    "build_container",
    "build_lifespan",
    "configure_logging",
]
