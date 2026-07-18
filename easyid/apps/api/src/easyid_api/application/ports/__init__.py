"""
Ports — abstract interfaces the application layer needs from the outside world.

Concrete implementations live under `infrastructure/` and are wired in
`bootstrap/container.py`. The application layer depends only on these
interfaces — never on SQLAlchemy or other infrastructure types.
"""

from easyid_api.application.ports.health import DatabaseHealth, DatabaseHealthStatus
from easyid_api.application.ports.repository import AbstractRepository
from easyid_api.application.ports.unit_of_work import UnitOfWork, UnitOfWorkFactory

__all__ = [
    "AbstractRepository",
    "DatabaseHealth",
    "DatabaseHealthStatus",
    "UnitOfWork",
    "UnitOfWorkFactory",
]
